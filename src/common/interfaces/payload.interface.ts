export interface IPayloadJWT {
  id: string;
  email: string;
  role: string;
}

export interface IPayloadUserAuth {
  userId: string;
  email: string;
  role: string;
}
