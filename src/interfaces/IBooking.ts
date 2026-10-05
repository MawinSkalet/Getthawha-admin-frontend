import IBranch from "./IBranch";
import IPackage from "./IPackage";
import IUser from "./IUser";
import IVoucher from "./IVoucher";

export default interface IBooking {
  id: string;
  date: string;
  duration?: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  user: IUser;
  branch: Pick<IBranch, "id" | "name"> & Partial<Pick<IBranch, "address">>;
  package: Pick<IPackage, "id" | "title"> & Partial<Pick<IPackage, "duration">>;
  voucher: Pick<IVoucher, "id" | "code"> | null;
}
