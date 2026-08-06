export default interface IPackage {
  type: "service" | "promotion";
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  pictureUrl: string | null;
  note: string | null;
}
