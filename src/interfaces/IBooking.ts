import IBranch from "./IBranch";
import IPackage from "./IPackage";
import IUser from "./IUser";
import IVoucher from "./IVoucher";

export default interface IBooking {
  id: string;
  date: string;
  duration: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  user: IUser;
  branch: Pick<IBranch, "id" | "name">;
  package: Pick<IPackage, "id" | "title">;
  voucher: Pick<IVoucher, "id" | "code"> | null;
}
