export default interface IPackageInput {
  type: "service" | "promotion";
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  pictureUrl: string | null;
  note: string | null;
}
