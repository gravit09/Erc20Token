import { useState, useEffect } from "react";
import { ethers } from "ethers";
import erc20abi from "./ERC20abi.json";
import ErrorMessage from "./ErrorMessage";
import TxList from "./TxList";

export default function App() {
  const [txs, setTxs] = useState([]);
  const [contractListened, setContractListened] = useState();
  const [error, setError] = useState();
  const [contractInfo, setContractInfo] = useState({
    address: "-",
    tokenName: "-",
    tokenSymbol: "-",
    totalSupply: "-",
  });
  const [balanceInfo, setBalanceInfo] = useState({
    address: "-",
    balance: "-",
  });

  const [stakeInfo, setStakeInfo] = useState({
    stakeRate: "-",
    stakedAmount: "-",
  });

  useEffect(() => {
    if (contractInfo.address !== "-") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const erc20 = new ethers.Contract(
        contractInfo.address,
        erc20abi,
        provider
      );

      erc20.on("Transfer", (from, to, amount, event) => {
        console.log({ from, to, amount, event });

        setTxs((currentTxs) => [
          ...currentTxs,
          {
            txHash: event.transactionHash,
            from,
            to,
            amount: String(amount),
          },
        ]);
      });
      setContractListened(erc20);

      return () => {
        contractListened.removeAllListeners();
      };
    }
  }, [contractInfo.address]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const erc20 = new ethers.Contract(data.get("addr"), erc20abi, provider);

    const tokenName = await erc20.name();
    const tokenSymbol = await erc20.symbol();
    const totalSupply = await erc20.totalSupply();

    setContractInfo({
      address: data.get("addr"),
      tokenName,
      tokenSymbol,
      totalSupply,
    });
  };

  const handleBurn = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    await erc20.burn(data.get("value"));
  };

  const handlePause = async (e) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    await erc20.pause();
  };

  const handleUnPause = async (e) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    await erc20.unpause();
  };

  const getMyBalance = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, provider);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const decimals = await erc20.decimals();
    const balance = await erc20.balanceOf(signerAddress);

    // Convert the balance from base units to actual tokens
    const balanceInTokens = ethers.utils.formatUnits(balance, decimals);

    setBalanceInfo({
      address: signerAddress,
      balance: String(balanceInTokens),
    });
  };

  const stakeBalance = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const erc20 = new ethers.Contract(
        contractInfo.address,
        erc20abi,
        provider
      );
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      const stakeRate = await erc20.stakingRewardsRate();
      const stakedAmount = await erc20.stakingBalance(signerAddress);

      setStakeInfo({
        stakeRate: String(stakeRate),
        stakedAmount: String(stakedAmount),
      });
      console.log(stakeRate);
    } catch (error) {
      console.error("Error fetching stake balance:", error);
      setError("Error fetching stake balance");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    await erc20.transfer(data.get("recipient"), data.get("amount"));
  };

  const handleStake = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    await erc20.stake(data.get("amount"));
  };

  const handleUnstake = async (e) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    await erc20.unstake();
  };

  const handleMint = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    await erc20.mint(data.get("MinterAddress"), data.get("value"));
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <div>
        <form className="m-4" onSubmit={handleSubmit}>
          <div className="credit-card w-full lg:w-3/4 sm:w-auto shadow-lg mx-auto rounded-xl bg-white">
            <main className="mt-4 p-4">
              <h1 className="text-xl font-semibold text-gray-700 text-center">
                Read from smart contract
              </h1>
              <div className="">
                <div className="my-3">
                  <input
                    type="text"
                    name="addr"
                    className="input input-bordered block w-full focus:ring focus:outline-none"
                    placeholder="ERC20 contract address"
                  />
                </div>
              </div>
            </main>
            <footer className="p-4">
              <button
                type="submit"
                className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
              >
                Get token info
              </button>
            </footer>
            <div className="px-4">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Symbol</th>
                      <th>Total supply</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>{contractInfo.tokenName}</th>
                      <td>{contractInfo.tokenSymbol}</td>
                      <td>{String(contractInfo.totalSupply)}</td>
                      <td>{contractInfo.deployedAt}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-4">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Stake Rate</th>
                      <th>Stake Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>{stakeInfo.stakeRate}</th>
                      <td>{String(stakeInfo.stakedAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <footer className="p-4">
              <button
                onClick={stakeBalance}
                className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
              >
                Get token Stake info
              </button>
            </footer>
            <div className="p-4">
              <button
                onClick={getMyBalance}
                type="submit"
                className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
              >
                Get my balance
              </button>
            </div>
            <div className="px-4">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>{balanceInfo.address}</th>
                      <td>{balanceInfo.balance}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </form>
        <div className="m-4 credit-card w-full lg:w-3/4 sm:w-auto shadow-lg mx-auto rounded-xl bg-white">
          <div className="mt-4 p-4">
            <h1 className="text-xl font-semibold text-gray-700 text-center">
              Write to contract
            </h1>
            <form onSubmit={handleTransfer}>
              <div className="my-3">
                <input
                  type="text"
                  name="recipient"
                  className="input input-bordered block w-full focus:ring focus:outline-none"
                  placeholder="Recipient address"
                />
              </div>
              <div className="my-3">
                <input
                  type="text"
                  name="amount"
                  className="input input-bordered block w-full focus:ring focus:outline-none"
                  placeholder="Amount to transfer"
                />
              </div>
              <footer className="p-4">
                <button
                  type="submit"
                  className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
                >
                  Transfer
                </button>
              </footer>
            </form>
          </div>
        </div>
        <div className="m-4 credit-card w-full lg:w-3/4 sm:w-auto shadow-lg mx-auto rounded-xl bg-white">
          <div className="mt-4 p-4">
            <h1 className="text-xl font-semibold text-gray-700 text-center">
              Burn Tokens
            </h1>
            <form onSubmit={handleBurn}>
              <div className="my-3">
                <input
                  type="text"
                  name="value"
                  className="input input-bordered block w-full focus:ring focus:outline-none"
                  placeholder="Amount to Burn"
                />
              </div>
              <footer className="p-4">
                <button
                  type="submit"
                  className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
                >
                  Burn
                </button>
              </footer>
            </form>
          </div>
        </div>
        <button
          onClick={handlePause}
          className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
        >
          Pause chain
        </button>
        <button
          onClick={handleUnPause}
          className="btn btn-primary  submit-button focus:ring focus:outline-none w-full mt-4"
        >
          UnPause chain
        </button>
        <form onSubmit={handleMint}>
          <div className="my-3">
            <input
              type="text"
              name="MinterAddress"
              className="input input-bordered block w-full focus:ring focus:outline-none"
              placeholder="Minter address"
            />
          </div>
          <div className="my-3">
            <input
              type="text"
              name="value"
              className="input input-bordered block w-full focus:ring focus:outline-none"
              placeholder="Amount to mint"
            />
          </div>
          <footer className="p-4">
            <button
              type="submit"
              className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
            >
              Mint Token
            </button>
          </footer>
        </form>
      </div>
      <div>
        <form onSubmit={handleStake}>
          <div className="my-3">
            <input
              type="text"
              name="amount"
              className="input input-bordered block w-full focus:ring focus:outline-none"
              placeholder="Amount to Stake"
            />
          </div>
          <footer className="p-4">
            <button
              type="submit"
              className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
            >
              Stake
            </button>
          </footer>
        </form>
        <button
          onClick={handleUnstake}
          className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
        >
          UnStake
        </button>
        <div className="m-4 credit-card w-full lg:w-3/4 sm:w-auto shadow-lg mx-auto rounded-xl bg-white">
          <div className="mt-4 p-4">
            <h1 className="text-xl font-semibold text-gray-700 text-center">
              Recent transactions
            </h1>
            <p>
              <TxList txs={txs} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
