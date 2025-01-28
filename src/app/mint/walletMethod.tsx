import MintPageHeading from '@/components/heading/mintPageHeading'
import GrayLine from '@/components/lines/grayLine'
import { useMintCtx } from '@/context/mintContext'
import Image from 'next/image'
import Error from '../../assets/icon/error.png'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseEther, parseGwei } from 'viem'
import { costValue } from '@/constant/encoteki'
import contractConfig from '@/config/contract-config'
import { useEffect } from 'react'

export default function WalletMethod() {
  const {
    setSection,
    setPaymentMethod,
    setHash,
    setTxSuccess,
    setIsSufficientFund,
    isSufficientFund,
  } = useMintCtx()

  useEffect(() => {
    setSection(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { isConnected, address } = useAccount()
  const { data } = useBalance({
    address: address,
  })

  const {
    data: hash,
    writeContract: mint,
    isPending: isMintLoading,
    isSuccess: isMintStarted,
    error: mintError,
  } = useWriteContract()

  const mintNFT = async () => {
    try {
      const isSufficientFund: boolean =
        Number(data?.value ?? 0) >= parseGwei(costValue.gwei)

      setIsSufficientFund(isSufficientFund)

      if (isSufficientFund) {
        mint({
          ...contractConfig,
          functionName: 'mint',
          args: [],
          value: parseEther(costValue.ether),
        })
      }
    } catch (error) {
      console.error('Minting failed:', error)
      throw error
    }
  }

  const { isSuccess: txSuccess, error: txError } = useWaitForTransactionReceipt(
    {
      hash,
    },
  )

  useEffect(() => {
    if (txSuccess) {
      setHash(hash)
      setTxSuccess(true)
    } else {
      setTxSuccess(false)
    }
  }, [txSuccess, setHash, setTxSuccess, hash])

  return (
    <>
      <MintPageHeading
        wording="Pay"
        action={() => {
          setPaymentMethod('')
          setSection(0)
        }}
      />
      <GrayLine />

      <div className="space-y-3 p-6">
        <section className="w-full">
          {/* Reminder box */}
          <div
            className={`mb-8 flex gap-2 rounded-xl bg-red-90 p-4 ${isSufficientFund ? 'hidden' : 'block'}`}
          >
            <Image src={Error} alt="Error" className="h-6 w-6" />
            <p>Insufficient fund. Please top up then try again.</p>
          </div>

          <div className="mb-8 flex justify-center">
            <ConnectButton />
          </div>

          <div className="flex w-full justify-between text-base font-medium">
            <p>Amount</p>
            <p>{costValue.ether} ETH</p>
          </div>
        </section>

        {/* Mint Button */}
        {isConnected && !txSuccess && (
          <button
            disabled={
              !mint || isMintLoading || isMintStarted || !isSufficientFund
            }
            className={`w-full rounded-[32px] duration-150 ${!isSufficientFund ? 'bg-neutral-60' : 'bg-primary-green hover:bg-green-900'} py-3`}
            data-mint-loading={isMintLoading}
            data-mint-started={isMintStarted}
            onClick={mintNFT}
          >
            <span className="font-medium text-white">
              {isMintLoading && 'Waiting...'}
              {isMintStarted && 'Minting...'}
              {!isMintLoading && !isMintStarted && 'Mint'}
              {mintError && txError && 'Try Again'}
            </span>
          </button>
        )}
      </div>
    </>
  )
}
