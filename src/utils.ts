import { getSchnorrAccount, getSchnorrWallet } from "@aztec/accounts/schnorr";
import { getDeployedTestAccountsWallets } from "@aztec/accounts/testing";
import {
  Note,
  ExtendedNote,
  GrumpkinScalar,
  createPXEClient,
  Contract,
  Fr,
  computeMessageSecretHash,
  AztecAddress,
} from "@aztec/aztec.js";

import { TokenContractArtifact, TokenContract } from "./contracts/token/src/artifacts/Token";

import 'dotenv/config';
import crypto from "crypto";

const PXE_URL = process.env.PXE_URL || "http://localhost:8080";

const pxe = createPXEClient(PXE_URL);

const accounts = await getDeployedTestAccountsWallets(pxe);

const adminWallet = accounts[0]
const adminAddress = adminWallet.getAddress();

const donationWallet = accounts[1];
const donationAddress = donationWallet.getAddress();

// change this to the  deployed Contract address
const deployedTokenContractAddress = AztecAddress.fromString(
  "0x2c5883b4e0457c8db2749ad8f64a0a13d6cd1b1cbf9540ff21cdba134cefac5d"
);

export async function deployANONToken() {
  const deployedContract = await TokenContract.deploy(
    adminWallet, // wallet instance
    adminWallet.getAddress(), // account
    "ANON", // constructor arg1
    "ANONToken", // constructor arg2
    18
  ) // constructor arg3
    .send()
    .deployed();

  console.log("deployedContract Address: ", deployedContract.address.toString());

  return deployedContract.address;
}

export const createAztecAccount = async () => {
  try {
    const privateRandomBytes = crypto.randomBytes(32);

    const privateHexString = "0x" + privateRandomBytes.toString("hex");

    let encryptionPrivateKey = GrumpkinScalar.fromString(privateHexString);

    const signingRandomBytes = crypto.randomBytes(32);

    const signingHexString = "0x" + signingRandomBytes.toString("hex");

    let signingPrivateKey = GrumpkinScalar.fromString(signingHexString);

    const userWallet = await getSchnorrAccount(
      pxe,
      encryptionPrivateKey,
      signingPrivateKey
    ).waitDeploy();

    let walletDetails = {
      "address": userWallet.getAddress().toString(),
      "signingKey": signingHexString,
    };

    return walletDetails;
  } catch (error) {
    return null;
  }
}

export const addMinter = async (address: string) => {
    try {
     
  const tokenContractAdmin = await TokenContract.at(
      deployedTokenContractAddress,
      adminWallet
    );
    // caller has to be an admin
    await tokenContractAdmin.methods
      .set_minter(AztecAddress.fromString(address), true)
      .send()
      .wait();

    return true;
  } catch (error) {
    console.log("ERROR: ", error)
    return null;
  }
};

// should only be called by admin
export const mintTokens = async () => {

  try {
    const tokenContractAdmin  = await TokenContract.at(
      deployedTokenContractAddress,
      adminWallet
    );

    const pendingShieldsStorageSlot = new Fr(5); // The storage slot of `pending_shields` is 5.
    const noteTypeId = new Fr(84114971101151129711410111011678111116101n); // TransparentNote

    // Create a secret and a corresponding hash that will be used to mint funds privately
    const userSecret = Fr.random();
    const userSecretHash = computeMessageSecretHash(userSecret);

    const amount = 1_000_000_000n;

    const receipt = await tokenContractAdmin.methods
      .mint_private(amount, userSecretHash)
      .send()
      .wait();

    const userPendingShield = new Note([new Fr(amount), userSecretHash]);
    await pxe.addNote(
      new ExtendedNote(
        userPendingShield,
        adminAddress,
        deployedTokenContractAddress,
        pendingShieldsStorageSlot,
        noteTypeId,
        receipt.txHash
      )
    );

    await tokenContractAdmin.methods
      .redeem_shield(adminAddress, amount, userSecret)
      .send()
      .wait();

    const _balance = await tokenContractAdmin.methods
      .balance_of_private(adminAddress)
      .view();

    return _balance;
  }
  catch (error) {
    return null;
  }
}

// transfers tokens from an admin to a user
export const claimTokens = async (
  address: string,
) => {
  try {
    const contract = await Contract.at(
      deployedTokenContractAddress,
      TokenContractArtifact,
      adminWallet
    );
    
    console.log("Contract: ", contract)
    const amount = 10_000n;

    // simulate nonce using randomness
    let min = 0;
    let max = 1000000;
    let nonce = Math.floor(Math.random() * (max - min + 1)) + min;

    const _tx = await contract.methods
      .transfer(adminAddress, AztecAddress.fromString(address), amount, nonce)
      .send()
      .wait();
    console.log("Transaction: ", _tx);
    return _tx.txHash;
  } catch (error) {
    console.log("Error: ", error);
    return null;
  }
};

// used to get the balance of a user
export const getUserBalance = async (address: string, signingKey: string) => {
  try {
    const userWallet = await getSchnorrWallet(
      pxe,
      AztecAddress.fromString(address),
      GrumpkinScalar.fromString(signingKey),
    );

    const contract = await Contract.at(
      deployedTokenContractAddress,
      TokenContractArtifact,
      userWallet
    );

    const _balance = await contract.methods
      .balance_of_private(userWallet.getAddress())
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
    const contract = await Contract.at(
      deployedTokenContractAddress,
      TokenContractArtifact,
      donationWallet
    );

    const _balance = await contract.methods
      .balance_of_private(donationAddress)
      .view();

    return _balance;
  } catch (error) {
    console.log("Error: ", error);
    return null;
  }
};

// used to send tokens from a user to the donation address
export const sendDonation = async (address: string, signingKey: string) => {
  try {
    const userWallet = await getSchnorrWallet(
      pxe,
      AztecAddress.fromString(address),
      GrumpkinScalar.fromString(signingKey),
    );

    const contract = await Contract.at(
      deployedTokenContractAddress,
      TokenContractArtifact,
      userWallet
    );

    const amount = 1_000n;
    // simulate nonce using randomness
    let min = 0;
    let max = 1000000;
    let nonce = Math.floor(Math.random() * (max - min + 1)) + min;

    const _tx = await contract.methods
      .transfer(userWallet.getAddress(), donationAddress, amount)
      .send()
      .wait();
    return _tx.txHash;
  } catch (error) {
    console.log("Error: ", error);
    return null;
  }
}
