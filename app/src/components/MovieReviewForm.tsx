'use client'
import { FunctionComponent } from "react"
import * as anchor from "@coral-xyz/anchor"
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react"
import { useWorkspace } from "@/context/anchor"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { signAndSendTx } from "@/utils/transactions"
 
const formSchema = z.object({
  title: z.string().min(2).max(32),
  description: z.string().min(2).max(1024),
  rating: z.coerce.number().min(1).max(5)
})

export const MovieReviewForm: FunctionComponent<{callback: any}> = ({callback}) => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  const workspace = useWorkspace()
  const program = workspace.program as any

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      rating: 1,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!wallet || !program) {
      alert("Please connect your wallet!")
      return
    }

    const { title, description, rating } = values

    const [movieReviewPda, bump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("movie_review"), Buffer.from(title), wallet.publicKey.toBuffer()],
        program.programId
      )
    
    const [reviewCommentCounterPda, _] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("counter"), movieReviewPda.toBuffer()],
        program.programId
      )

    const transaction = new anchor.web3.Transaction()

    const instruction = await program.methods
      .addMovieReview(title, description, rating)
      .accounts({
        movieReview: movieReviewPda,
        reviewer: wallet!.publicKey,
        reviewCommentCounter: reviewCommentCounterPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([])
      .instruction()

    transaction.add(instruction)

    try {
      let txid = await signAndSendTx(connection, transaction, wallet!);
      console.log(
        `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=local`
      )
      alert(
        `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=local`
      )
      callback()
    } catch (e) {
      console.log(JSON.stringify(e))
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 w-1/2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标题</FormLabel>
                <FormControl>
                  <Input placeholder="Enter title" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter a title for your movie review.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>简介</FormLabel>
                <FormControl>
                  <Input placeholder="Enter description" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter a brief description of your movie review.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>评分</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" min={1} max={5} {...field} />
                </FormControl>
                <FormDescription>
                  Please enter a rating for your movie review.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">提交</Button>
        </form>
      </Form>
    </div>
    
  )
}
