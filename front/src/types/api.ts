/** Shape of a successful CHCars API response. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}
