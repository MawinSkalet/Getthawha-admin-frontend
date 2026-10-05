export default interface IUser {
  id: string;
  displayName: string;
  pictureUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
