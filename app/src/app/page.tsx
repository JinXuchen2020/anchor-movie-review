import { Header } from "@/components/Header";
import { MovieReviews } from "@/components/MovieReviews";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <>      
      <Header />
      <MovieReviews callback={async () => {
        "use server"
        redirect("/add-movie-review")
      }} />    
    </>
  );
}
