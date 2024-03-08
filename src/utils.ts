import { getSchnorrAccount, getSchnorrWallet } from "@aztec/accounts/schnorr";
import { getDeployedTestAccountsWallets } from "@aztec/accounts/testing";
import {
  Note,
  ExtendedNote,
  GrumpkinScalar,
  createPXEClient,
  Fr,
  computeMessageSecretHash,
  AztecAddress,
} from "@aztec/aztec.js";

import { EasyPrivateTokenContract } from "./contracts/easy_private_token_contract/src/artifacts/EasyPrivateToken";

import "dotenv/config";

const PXE_URL = process.env.PXE_URL || "http://127.0.0.1:8080";

const pxe = createPXEClient(PXE_URL);

const accounts = await getDeployedTestAccountsWallets(pxe);

const adminWallet = accounts[0];
const adminAddress = adminWallet.getAddress();

const donationWallet = accounts[1];
const donationAddress = donationWallet.getAddress();

// change this to the  deployed Contract address
const deployedTokenContractAddress = AztecAddress.fromString(
  "0x207e97b9204ddebca5fb918695138cbd197474d6a83b048f8017aa109dd51036"
);

export async function deployANONToken() {
  try {
    let amount = 1000000000;
    const deployedContract = await EasyPrivateTokenContract.deploy(
      adminWallet, // wallet instance
      amount,
      adminWallet.getAddress(), // account
    )
      .send()
      .deployed();

    console.log(
      "deployedContract Address: ",
      deployedContract.address.toString()
    );

    return deployedContract.address;
  } catch (error) {
    console.log("Error deploying ANON Token: ", error)
    return null;
  }
}

export const createAztecAccount = async () => {
  try {
    const encryptionPrivateKey = GrumpkinScalar.random();

    const signingPrivateKey = GrumpkinScalar.random();

    const userWallet = await getSchnorrAccount(
      pxe,
      encryptionPrivateKey,
      signingPrivateKey
    ).waitDeploy();

    let walletDetails = {
      address: userWallet.getAddress().toString(),
      signingKey: signingPrivateKey.toString(),
    };

    return walletDetails;
  } catch (error) {
    return null;
  }
}

// transfers tokens from an admin to a user
export const claimTokens = async (
  address: string,
) => {
  try {
    const contract  = await EasyPrivateTokenContract.at(
      deployedTokenContractAddress,
      adminWallet
    );

    let amount = 10_000n;

    console.log("Transfer Address: ", address);
    const _tx = await contract.methods
      .transfer(amount, adminAddress, AztecAddress.fromString(address))
      .send()
      .wait();
    console.log("Transaction: ", _tx);
    return _tx.txHash;
  } catch (error) {
    console.log("Error: ", error);
    return null;
  }
}

// used to get the balance of a user
export const getUserBalance = async (address: string, signingKey: string) => {
  try {
    const userWallet = await getSchnorrWallet(
      pxe,
      AztecAddress.fromString(address),
      GrumpkinScalar.fromString(signingKey),
    );

    const contract = await EasyPrivateTokenContract.at(
      deployedTokenContractAddress,
      userWallet
    );

    const _balance = await contract.methods
      .getBalance(userWallet.getAddress())
      .view();

    return _balance;
  } catch (error) {
    console.log("Error: ", error);
    return null;
  }
};


// Used to get the balance of the donation address
export const getDonationBalance = async () => {
  try {
    const contract = await EasyPrivateTokenContract.at(
      deployedTokenContractAddress,
      donationWallet
    );

    const _balance = await contract.methods.getBalance(donationAddress).view();

    return _balance;
  } catch (error) {
    console.log("Error: ", error);
    return null;
  }
}

// used to send tokens from a user to the donation address
export const sendDonation = async (address: string, signingKey: string) => {
  try {
    const userWallet = await getSchnorrWallet(
      pxe,
      AztecAddress.fromString(address),
      GrumpkinScalar.fromString(signingKey),
    );

    const contract = await EasyPrivateTokenContract.at(
      deployedTokenContractAddress,
      userWallet
    );

    const amount = 1_000n;
    
    const _tx = await contract.methods
      .transfer(amount, userWallet.getAddress(), donationAddress)
      .send()
      .wait();
    return _tx.txHash;
  } catch (error) {
    console.log("Error: ", error);
    return null;
  }
}
