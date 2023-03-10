import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import './index.scss'
import dayjs from 'dayjs'
import QuestionHelper from '../../../../components/QuestionHelper'
import NumericalInput from '../../../../components/NumericalInput'
import { ButtonPrimary } from '../../../../components/Button'
import { useActiveWeb3React } from '../../../../hooks'
import { useWalletModalToggle } from '../../../../state/application/hooks'
import { useTokenBalance } from '../../../../state/wallet/hooks'
import { useGomConContract } from '../../../../hooks/useContract'
import { VELT } from '../../../../constants'
import { Select } from 'antd'
import { useToVote } from '../../../../hooks/ahp/useGomVote'
import { JSBI, Percent, Token } from '@uniswap/sdk'
import { useSingleCallResult } from '../../../../state/multicall/hooks'
import ActionButton from '../../../../components/Button/ActionButton'
import TransactionConfirmationModal, {
  TransactionErrorContent
} from '../../../../components/TransactionConfirmationModal'

interface VoteProps {
  votiingData: any
  gombocList: any
}

const Vote = ({ votiingData, gombocList }: VoteProps) => {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const gomConContract = useGomConContract()
  const { toVote } = useToVote()
  const [curToken, setCurToken] = useState<Token | undefined>(VELT[chainId ?? 1])
  const veLtBal = useTokenBalance(account ?? undefined, VELT[chainId ?? 1])
  const [voteAmount, setVoteAmount] = useState('')

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm
  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  const { Option } = Select
  const endDate = dayjs()
    .add(10, 'day')
    .format('YYYY-MM-DD')
  const [amount, setAmount] = useState('')
  const [curGomAddress, setCurGomAddress] = useState('')
  const [endTimeData, setEndTimeData] = useState({
    d: '00',
    h: '00',
    m: '00',
    s: '00'
  })
  const timer = useRef<any>(null)
  const cd = useRef<number>(0)
  const dealData = () => {
    if (cd.current <= 0) {
      setEndTimeData({
        d: '00',
        h: '00',
        m: '00',
        s: '00'
      })
      return timer.current && clearTimeout(timer.current)
    }
    const d = parseInt(`${cd.current / (24 * 60 * 60)}`)
    const h = parseInt(`${(cd.current / (60 * 60)) % 24}`)
    const m = parseInt(`${(cd.current / 60) % 60}`)
    const s = parseInt(`${cd.current % 60}`)
    const pd = Number(d) > 9 ? `${d}` : `0${d}`
    const ph = Number(h) > 9 ? `${h}` : `0${h}`
    const pm = Number(m) > 9 ? `${m}` : `0${m}`
    const ps = Number(s) > 9 ? `${s}` : `0${s}`
    setEndTimeData({
      d: pd,
      h: ph,
      m: pm,
      s: ps
    })
    cd.current--
    timer.current = setTimeout(() => {
      dealData()
    }, 1000)
  }

  const selList = useMemo(() => {
    if (gombocList) {
      const arr: any = []
      gombocList.forEach((e: any) => {
        const item = {
          label: e.name,
          value: e.gomboc
        }
        arr.push(item)
      })
      return arr
    } else {
      return []
    }
  }, [gombocList])

  const lastArg = useMemo(() => {
    let res: any = [undefined]
    if (account && curGomAddress) {
      res = [account, curGomAddress]
    }
    return res
  }, [account, curGomAddress])

  const votePowerAmount = useSingleCallResult(gomConContract, 'voteUserPower', [account ?? undefined])
  const lastVoteData = useSingleCallResult(gomConContract, 'lastUserVote', lastArg)
  const curPower = useSingleCallResult(gomConContract, 'voteUserSlopes', lastArg)

  const curLastVote = useMemo(() => {
    let res = false
    const ld = Number(lastVoteData.result)
    if (lastVoteData && ld && curGomAddress) {
      const now = dayjs()
      const end = dayjs.unix(ld).add(10, 'day')
      res = now.isBefore(end)
    }
    return res
  }, [lastVoteData, curGomAddress])

  const unUseRateVal = useMemo(() => {
    let res = ''
    if (votePowerAmount && Number(votePowerAmount.result)) {
      const total = JSBI.BigInt(10000)
      const apo = JSBI.BigInt(Number(votePowerAmount.result))
      const unUseVal = JSBI.subtract(total, apo)
      const ra = new Percent(unUseVal, JSBI.BigInt(10000))
      if (ra.toFixed(2) && Number(ra.toFixed(2)) > 0) {
        res = ra.toFixed(2)
      }
    }
    return res
  }, [votePowerAmount])

  const subAmount = useMemo(() => {
    let sub = 0
    if (unUseRateVal && curPower.result && curPower.result.power) {
      const cp = JSBI.BigInt(Number(curPower.result.power))
      const ra = new Percent(cp, JSBI.BigInt(10000))
      sub = Number(ra.toFixed(2)) + Number(unUseRateVal)
    }
    return sub
  }, [unUseRateVal, curPower])

  const voteInputError = useMemo(() => {
    if (curLastVote) {
      return 'No voting within ten days'
    }
    if (amount && (Number(amount) > 100 || Number(amount) === 0)) {
      return 'Insufficient Value'
    }
    if (amount && Number(subAmount) < Number(amount)) {
      return 'Surplus deficiency'
    }

    return undefined
  }, [amount, curLastVote, subAmount])

  const getActionText = useMemo(() => {
    let res = 'Select a G??mb??c for Vote'
    if (voteInputError) {
      res = voteInputError
    } else if (!curGomAddress) {
      res = 'Select a G??mb??c for Vote'
    } else if (!amount) {
      res = 'Enter amount'
    } else {
      res = 'Confirm Vote'
    }
    return res
  }, [voteInputError, amount, curGomAddress])

  const toVoteCallback = useCallback(async () => {
    if (!amount || !account) return
    setCurToken(undefined)
    setShowConfirm(true)
    setAttemptingTxn(true)
    const argAmount = Math.floor(Number(amount) * 100)
    console.log(curGomAddress)
    toVote(curGomAddress, argAmount)
      .then((hash: any) => {
        setAttemptingTxn(false)
        setTxHash(hash)
        setAmount('')
        setCurGomAddress('')
      })
      .catch((err: any) => {
        setAttemptingTxn(false)
        console.log(err)
        setErrorMessage(err.message)
      })
  }, [amount, curGomAddress, account, toVote])

  useEffect((): any => {
    cd.current = votiingData.votingEndSeconds
    dealData()
    return () => {
      timer.current && clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votiingData])

  function changeAmount(val: any) {
    setAmount(val)
    if (val && veLtBal && Number(veLtBal.toFixed(2)) > 0) {
      const rate = Math.floor(Number(val) * 100)
      const bal = veLtBal.multiply(JSBI.BigInt(rate)).divide(JSBI.BigInt(100))
      setVoteAmount(bal?.toFixed(2))
    } else {
      setVoteAmount('')
    }
  }

  function changeSel(val: string) {
    setCurGomAddress(val)
  }

  const confirmationContent = useCallback(
    () =>
      errorMessage ? (
        <TransactionErrorContent onDismiss={() => setShowConfirm(false)} message={errorMessage} />
      ) : (
        <div></div>
      ),
    [errorMessage]
  )

  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={confirmationContent}
        pendingText={''}
        currencyToAdd={curToken}
        isShowSubscribe={false}
      />
      <div className="gom-vote-box">
        <h3 className="font-bolder text-white font-20">Proposed G??mb??c Weight Changes</h3>
        <p className="m-t-20 text-white lh15">
          - Your vote directs future liquidity mining emissions starting from the next period on Thursday at 0:00 UTC.
        </p>
        <p className="m-t-10 text-white lh15">
          - Voting power is set at the time of the vote. If you get more veLT later, resubmit your vote to use your
          increased power.
        </p>
        <p className="m-t-10 text-white lh15">
          - Votes are time locked for 10 days. If you vote now, no edits can be made until{' '}
          <span className="text-primary">{endDate}</span>.
        </p>
        <div className="text-center text-normal m-t-20 flex jc-center ai-center">
          Voting period ends
          <QuestionHelper text="Voting period ends" />
        </div>
        <div className="end-time-box flex m-t-20 w-100">
          <div className="flex-1">
            <p className="text-center text-gray">Day</p>
            <div className="flex jc-center m-t-8">
              <div className="end-item">{cd.current > 0 && endTimeData.d ? endTimeData.d : '00'}</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-center text-gray">Hour</p>
            <div className="flex jc-center m-t-8">
              <div className="end-item">{cd.current > 0 && endTimeData.h ? endTimeData.h : '00'}</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-center text-gray">Min</p>
            <div className="flex jc-center m-t-8">
              <div className="end-item">{cd.current > 0 && endTimeData.m ? endTimeData.m : '00'}</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-center text-gray">Sec</p>
            <div className="flex jc-center m-t-8">
              <div className="end-item">{cd.current > 0 && endTimeData.s ? endTimeData.s : '00'}</div>
            </div>
          </div>
        </div>
        <div className="form-box m-t-20">
          <p className="text-normal">Select a G??mb??c </p>
          <Select
            value={curGomAddress}
            onChange={(val: string) => {
              changeSel(val)
            }}
            className="hp-select m-t-10"
          >
            {selList.map((data: any, index: number) => {
              return (
                <Option key={index} value={data.value}>
                  {data.label}
                </Option>
              )
            })}
          </Select>
          <div className="flex jc-between m-t-30 m-b-10">
            <span className="text-normal">Vote weight:</span>
            <p>
              unallocated votes : {unUseRateVal}%<span className="text-primary m-l-5">Lock</span>
            </p>
          </div>
          <div className="hp-amount-box">
            <NumericalInput
              className={['hp-amount'].join(' ')}
              value={amount}
              decimals={2}
              align={'right'}
              onUserInput={val => {
                changeAmount(val)
              }}
            />
            <span className="input-tip">% of your voting power</span>
          </div>
          <p className="text-normal m-t-10">
            {voteAmount || '--'} of your voting power will be allocated to this g??mb??c.
          </p>
          <div className="action-box m-t-40">
            {!account ? (
              <ButtonPrimary className="hp-button-primary" onClick={toggleWalletModal}>
                Connect Wallet
              </ButtonPrimary>
            ) : (
              <ActionButton
                error={voteInputError}
                // pending={approvalState === ApprovalState.PENDING}
                disableAction={!amount || !curGomAddress || curLastVote}
                actionText={getActionText}
                onAction={toVoteCallback}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Vote
