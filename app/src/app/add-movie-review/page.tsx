import { Header } from "@/components/Header";
import { MovieReviewForm } from "@/components/MovieReviewForm";
import { redirect } from "next/navigation";

export default function Page() {
  return (
    <>      
      <Header />
      <MovieReviewForm callback={async () => {
        "use server"
        redirect("/")
      }} />    
    </>
  );
}
