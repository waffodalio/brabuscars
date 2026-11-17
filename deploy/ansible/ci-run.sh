#!/usr/bin/env bash
# Lance le playbook depuis GitHub Actions (.github/workflows/server.yml), avec
# les mêmes accès que le déploiement : rien à garder sur un poste.
#
#   MODE=check  → ansible-playbook --check --diff (ne modifie rien)
#   MODE=apply  → applique
#   MODE=drift  → --check ; échoue si le serveur diffère du dépôt
#
# Entrées (secrets / variables GitHub) : SSH_HOST, SSH_USER, SSH_PORT,
# SSH_KEY, KNOWN_HOSTS. Le compte DEPLOY_USER doit avoir sudo sans mot de
# passe (README § « CI/CD et déploiement », étape 1).
set -euo pipefail

: "${MODE:?}" "${SSH_HOST:?}" "${SSH_USER:?}" "${SSH_PORT:?}" "${SSH_KEY:?}" "${KNOWN_HOSTS:?}"
cd "$(dirname "$0")"

# Clé et hôte connu : comme deploy.yml (aucune confirmation d'empreinte).
install -m 700 -d ~/.ssh
printf '%s\n' "$SSH_KEY" > ~/.ssh/id_deploy
printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts
chmod 600 ~/.ssh/id_deploy ~/.ssh/known_hosts

# Inventaire régénéré à chaque exécution depuis les secrets (jamais commité).
# Le port est explicite : le pare-feu (manage_firewall) ouvre ansible_port.
umask 077
cat > inventory.yml <<EOF
all:
  hosts:
    chcars:
      ansible_host: "${SSH_HOST}"
      ansible_port: ${SSH_PORT}
      ansible_user: "${SSH_USER}"
      ansible_ssh_private_key_file: ~/.ssh/id_deploy
      deploy_user: "${SSH_USER}"
EOF
umask 022

# Version figée, dans un environnement à part : le runner fournit déjà une
# autre version d'Ansible, qui changerait d'une image à l'autre.
venv="${RUNNER_TEMP:-/tmp}/ansible"
python3 -m venv "$venv"
"$venv/bin/pip" install --quiet "ansible-core>=2.18,<2.19"
export PATH="$venv/bin:$PATH"
ansible-playbook --version
ansible-galaxy collection install -r requirements.yml >/dev/null

args=()
case "$MODE" in
  check | drift) args=(--check --diff) ;;
  apply) ;;
  *) echo "::error::MODE inconnu : $MODE"; exit 1 ;;
esac

export ANSIBLE_FORCE_COLOR=1
ansible-playbook site.yml "${args[@]}" | tee playbook.log

# Récapitulatif : « changed=N » de la ligne PLAY RECAP.
changed=$(sed -n 's/\x1b\[[0-9;]*m//g; s/.*changed=\([0-9]*\).*/\1/p' playbook.log | tail -n 1)
changed=${changed:-0}
{
  echo "### Serveur — ${MODE}"
  case "$MODE" in
    apply) echo "Appliqué : **${changed}** changement(s)." ;;
    *) echo "Différences entre le dépôt et le serveur : **${changed}** (rien n'a été modifié)." ;;
  esac
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"

if [ "$MODE" = drift ] && [ "$changed" -gt 0 ]; then
  echo "::error::Le serveur ne correspond plus au dépôt (${changed} différence(s)) : voir le --diff ci-dessus."
  exit 1
fi
