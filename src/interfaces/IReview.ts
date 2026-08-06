import type IBranch from "./IBranch";
import type IUser from "./IUser";

export default interface IReview {
  id: string;
  userId: string;
  branchId: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<IUser, "id" | "displayName" | "pictureUrl">;
  branch?: Pick<IBranch, "id" | "name">;
}
