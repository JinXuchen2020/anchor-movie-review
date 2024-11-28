import { PublicKey } from "@solana/web3.js"

const MockWallet = {
  publicKey: new PublicKey("CGVEHV5CP4K1adx8KPfjV1uo6JWAKTTM5kEQ46RRPPFW"),
  signTransaction: () => Promise.reject(),
  signAllTransactions: () => Promise.reject(),
}

export default MockWallet