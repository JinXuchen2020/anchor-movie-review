'use client'
import { FC } from 'react'
import styles from '@/styles/Home.module.css'
import Image from 'next/image'
import dynamic from 'next/dynamic'

export const Header: FC = () => {
  const WalletMultiButtonDynamic = dynamic(
    async () =>
      (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
    { ssr: false }
  )

  return (
    <div className={styles.AppHeader}>
      <Image src="/solanaLogo.png" height={30} width={200} alt={''} />
      <span>Movie Reviews</span>
      <div className ="flex items-center">
        <WalletMultiButtonDynamic style={{ marginRight: "12px" }} />
      </div>
    </div>
  )
}