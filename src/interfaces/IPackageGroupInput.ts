import type IPackageInput from "@/interfaces/IPackageInput";

export default interface IPackageGroupInput
  extends Omit<IPackageInput, "price" | "duration"> {
  title: string;
  category: string;
  isActive: boolean;
  variants: Array<{ duration: 60 | 90 | 120; price: number }>;
}
