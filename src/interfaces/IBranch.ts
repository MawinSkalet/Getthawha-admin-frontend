export default interface IBranch {
  id: string;
  name: string;
  address: string;
  googleMapUrl: string;
  phone: string;
  pictureUrl?: string | null;
  googleMapEmbedUrl?: string;
  description?: string;
}
