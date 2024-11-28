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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { signAndSendTx } from "@/utils/transactions"
import { PublicKey } from "@solana/web3.js"
 
const formSchema = z.object({
  comment: z.string().min(2).max(1024)
})

export const ReviewCommentForm: FunctionComponent<{reviewKey: PublicKey, callback: any}> = ({reviewKey, callback}) => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  const workspace = useWorkspace()
  const program = workspace.program as any

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comment: ""
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!wallet || !program) {
      alert("Please connect your wallet!")
      return
    }

    const { comment } = values

    const [reviewCommentCounterPda, _b] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("counter"), reviewKey.toBuffer()],
        program.programId
      )
    const currentCounter = await program.account.reviewCommentCounter.fetch(reviewCommentCounterPda);
    
    const [reviewCommentPda, _] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [reviewKey.toBuffer(), Buffer.from([currentCounter.counter])],
        program.programId
      )
    
    console.log("reviewCommentPda", reviewCommentPda.toBase58())

    const transaction = new anchor.web3.Transaction()

    const instruction = await program.methods
      .addReviewComment(comment)
      .accounts({
        movieComment: reviewCommentPda,
        movieReview: reviewKey,
        movieCommentCounter: reviewCommentCounterPda,
        commenter: wallet!.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([])
      .instruction()

    transaction.add(instruction)

    try {
      let txid = await signAndSendTx(connection, transaction, wallet!);
      alert(
        `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=local`
      )
      callback()
    } catch (e) {
      console.log(JSON.stringify(e))
      alert(JSON.stringify(e))
    }
  }

  return (
    <div className="flex gap-4 w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}  className="w-full flex justify-between align-middle items-center space-x-4">
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem className="flex flex-1 justify-between align-middle items-center space-y-0 space-x-2">
                <FormLabel className="text-nowrap" >评论：</FormLabel>
                <FormControl >
                  <Input placeholder="Please enter a comment." {...field} />
                </FormControl>
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
