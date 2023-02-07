import { useCallback } from 'react'
import { useSingleCallResult } from '../../state/multicall/hooks'
import { useLockerContract } from '../useContract'
import { useActiveWeb3React } from '../index'
import JSBI from 'jsbi'
import { LT } from '../../constants'
import { CurrencyAmount } from '@uniswap/sdk'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { calculateGasMargin } from '../../utils'
import { TransactionResponse } from '@ethersproject/providers'
import format from '../../utils/format'

export function useLocker() {
  const { chainId } = useActiveWeb3React()
  const buyHopeContract = useLockerContract()
  const lockerRes = useSingleCallResult(buyHopeContract, 'locked', [LT[chainId ?? 1].address])

  return {
    lockerRes: lockerRes?.result
      ? {
          amount: lockerRes?.result?.amount ? CurrencyAmount.ether(lockerRes?.result?.amount) : 0,
          end: `${lockerRes?.result?.end}` === '0' ? '--' : format.formatDate(Number(`${lockerRes?.result?.end}`))
        }
      : undefined
  }
}

export function useToLocker() {
  const addTransaction = useTransactionAdder()
  const contract = useLockerContract()
  const { account } = useActiveWeb3React()
  const toLocker = useCallback(
    async (amount: CurrencyAmount, date: any, NONCE, DEADLINE, sigVal) => {
      if (!account) throw new Error('none account')
      if (!contract) throw new Error('none contract')
      if (amount.equalTo(JSBI.BigInt('0'))) throw new Error('amount is un support')
      if (!date) throw new Error('none date')
      const args = [amount.raw.toString(), date, NONCE, DEADLINE, sigVal]
      const method = 'createLock'
      console.log('args', args)
      return contract.estimateGas[method](...args, { from: account }).then(estimatedGasLimit => {
        return contract[method](...args, {
          gasLimit: calculateGasMargin(estimatedGasLimit),
          // gasLimit: '3500000',
          from: account
        }).then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Buy ${amount
              .multiply(JSBI.BigInt('5'))
              .toSignificant(4, { groupSeparator: ',' })
              .toString()}  RAM with ${amount.toSignificant()} USDT`
          })
          return response.hash
        })
      })
    },
    [account, addTransaction, contract]
  )
  return {
    toLocker
  }
}
