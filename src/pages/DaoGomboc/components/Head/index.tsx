import React from 'react'
import './index.scss'
import headImg1 from '../../../../assets/images/ahp/icon-submit.png'

/**
 *
 * @param props
 *
 */

const Head = () => {
  return (
    <div className="gom-head-box">
      <div className="flex">
        <div className="flex-1 m-r-30">
          <h2 className="text-white font-bolder font-28">How to get liquidity incentives?</h2>
          <p className="text-white lh18 m-t-15">
            Babe Protocol liquidity incentives are directed to pools by veBABE voters. Stake in these pools to earn
            incentives. Boost with veBABE for up to 2.5x extra on pools.
          </p>
          <a className="learn-more m-t-20" href="/">
            Learn more
          </a>
        </div>
        <div className="flex-1 flex ai-center m-l-30">
          <div className="flex-1">
            <div className="flex jc-center">
              <img className="head-img" src={headImg1} alt="" />
            </div>
            <p className="text-center text-white m-t-30">Add Liquidity</p>
          </div>
          <div className="flex-1">
            <div className="flex jc-center">
              <img className="head-img" src={headImg1} alt="" />
            </div>
            <p className="text-center text-white m-t-30">Stake LP Token</p>
          </div>
          <div className="flex-1">
            <div className="flex jc-center">
              <img className="head-img" src={headImg1} alt="" />
            </div>
            <p className="text-center text-white m-t-30">Stake LP Token</p>
          </div>
          <div className="flex-1">
            <div className="flex jc-center">
              <img className="head-img" src={headImg1} alt="" />
            </div>
            <p className="text-center text-white m-t-30">Claim anytime</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Head
