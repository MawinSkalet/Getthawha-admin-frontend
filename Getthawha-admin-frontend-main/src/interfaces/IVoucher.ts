export default interface IVoucher {
  id: string;
  code: string;
  discount: number; // in percentage
  isExpired: boolean;
}
