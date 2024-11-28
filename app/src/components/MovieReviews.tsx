'use client'
import { FunctionComponent, useEffect, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWorkspace } from "@/context/anchor"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { IdlMovieReviewWithComment } from "@/utils/anchor_movie_review"
import { ReviewCommentForm } from "./ReviewCommentForm"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination"

export const MovieReviews: FunctionComponent<{callback: any}> = ({callback}) => {
  const workspace = useWorkspace()
  const [movieReviews, setMovieReviews] = useState<IdlMovieReviewWithComment[] | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [result, setResult] = useState<IdlMovieReviewWithComment[] | null>(null)
  const wallet = useWallet()
  console.log(wallet)

  useEffect(() => {
    const fetchAccounts = async () => {
      const accounts =
        (await workspace.program?.account.movieReview.all()) ?? []

      const sort = [...accounts].sort((a, b) =>
        a.account.title > b.account.title ? 1 : -1
      );
      setMovieReviews(sort)
    }
    
    // if (wallet.connected) {
    fetchAccounts()      
    // }
  }, [])

  useEffect(() => {
    if (movieReviews && search != "") {
      const filtered = movieReviews.filter((movie: IdlMovieReviewWithComment) => {
        return movie.account.title
          .toLowerCase()
          .startsWith(search.toLowerCase())
      })
      console.log(filtered)
      setResult(filtered)
    }
  }, [search])

  useEffect(() => {
    if (movieReviews) {
      const filtered = movieReviews.slice((page - 1) * 3, page * 3)
      console.log(filtered)
      setResult(filtered)
    }
  }, [page, movieReviews])

  const fetchMyReviews = async () => {
    if (wallet.connected) {
      const accounts =
        (await workspace.program?.account.movieReview.all([
          {
            memcmp: {
              offset: 8,
              bytes: wallet.publicKey!.toBase58(),
            },
          },
        ])) ?? []

      const sort = [...accounts].sort((a, b) =>
        a.account.title > b.account.title ? 1 : -1
      )
      setResult(sort)
    } else {
      alert("Please Connect Wallet")
    }
  }

  const handleAddReview = async () => {
    if (wallet.connected) {
      callback();
    } else {
      alert("Please Connect Wallet")
    }
  }

  const fetchReviewComments = async (movieReview: IdlMovieReviewWithComment, showComment: boolean) => {
    if (wallet.connected) {
      const accounts =
        (await workspace.program?.account.movieComment.all()) ?? []

      movieReview.comment = accounts.filter((comment) => comment.account.movieReview.toBase58() === movieReview.publicKey.toBase58()).sort((a, b) =>
        a.account.count > b.account.count ? -1 : 1
      );
      movieReview.isShowComment = showComment;
      const index = movieReviews!.findIndex((review) => review.publicKey.toBase58() === movieReview.publicKey.toBase58())
      movieReviews?.splice(index, 1, movieReview)
      setMovieReviews([...movieReviews!])
    } else {
      alert("Please Connect Wallet")
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 justify-between h-full">
      <div className="flex justify-between items-center mb-4 gap-4 w-1/3 ">
        <Input
          id="search"
          color="gray.400"
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search"
        />
        <Button onClick={fetchMyReviews}>My Reviews</Button>
        <Button onClick={handleAddReview}>添加评论</Button>
      </div>
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.map((data) => {
            return <Card key={data.publicKey.toBase58()}>
              <CardHeader>
                <CardTitle>{data.account.title}</CardTitle>
                <CardDescription>{data.account.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {
                  data.isShowComment && data.comment && data.comment.length > 0 && (
                    <div className="flex flex-col gap-4">
                      {data.comment.map((comment) => {
                        return <div key={comment.publicKey.toBase58()} className="flex gap-4">第{comment.account.count + 1}条评论: {comment.account.comment}</div>
                      })}
                    </div>
                  )
                }
              </CardContent>
              <CardFooter>
                <div className="flex justify-right items-center w-full" style={data.isShowComment ? {display:"none"} : {display: "block"}} >
                  <Button onClick={() => fetchReviewComments(data, true)}>查看评论</Button>
                </div>
                <div className="flex flex-col items-center w-full" style={data.isShowComment ? {display:"block"} : {display: "none"}} >
                  <ReviewCommentForm reviewKey={data.publicKey} callback={()=> {
                    fetchReviewComments(data, true)
                  }} />
                </div>
              </CardFooter>
            </Card>
          })}
        </div>
      )}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={() => page> 1 && setPage(page - 1)} />
          </PaginationItem>
          <PaginationItem>
            {
              movieReviews &&Array.from(Array(Math.ceil(movieReviews.length / 3)).keys()).map((index) => {
                return <PaginationLink key={index} href="#" onClick={() => setPage(index + 1)} >{(index + 1)}</PaginationLink>
              })
            }
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" onClick={() => page * 3 < movieReviews!.length && setPage(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
