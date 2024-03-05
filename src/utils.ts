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

const PXE_URL = process.env.PXE_URL || "http://localhost:8080";
const encryptionPrivateKey = GrumpkinScalar.random();
const signingPrivateKey = GrumpkinScalar.random();
const pxe = createPXEClient(PXE_URL);

const accounts = await getDeployedTestAccountsWallets(pxe);

const adminWallet = accounts[0]
const adminAddress = adminWallet.getAddress();

// change this to the  deployed Contract address
const deployedTokenContractAddress = AztecAddress.fromString(
  "0x163479a6307c2b2246860f4389d59bbafb4e5ce7498a196c5665e3e28ffbf43e"
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
    const userWallet = await getSchnorrAccount(
      pxe,
      encryptionPrivateKey,
      signingPrivateKey
    ).waitDeploy();

    return userWallet;
  } catch (error) {
    return null;
  }
}

export const addMinter = async (wallet) => {
    try {
     
  const tokenContractAdmin = await TokenContract.at(
      deployedTokenContractAddress,
      adminWallet
    );
    // caller has to be an admin
    await tokenContractAdmin.methods
      .set_minter(wallet.getAddress(), true)
      .send()
      .wait();

    return true;
  } catch (error) {
    console.log("ERROR: ", error)
    return null;
  }
};

export const mintTokens = async (userWallet) => {

  try {
    
    const tokenContractUser  = await TokenContract.at(
      deployedTokenContractAddress,
      userWallet
    );

    const userAddress = userWallet.getAddress();

    const pendingShieldsStorageSlot = new Fr(5); // The storage slot of `pending_shields` is 5.
    const noteTypeId = new Fr(84114971101151129711410111011678111116101n); // TransparentNote

    // Create a secret and a corresponding hash that will be used to mint funds privately
    const userSecret = Fr.random();
    const userSecretHash = computeMessageSecretHash(userSecret);

    const amount = 10_000n;

    const receipt = await tokenContractUser.methods
      .mint_private(amount, userSecretHash)
      .send()
      .wait();

    const userPendingShield = new Note([new Fr(amount), userSecretHash]);
    await pxe.addNote(
      new ExtendedNote(
        userPendingShield,
        userAddress,
        deployedTokenContractAddress,
        pendingShieldsStorageSlot,
        noteTypeId,
        receipt.txHash
      )
    );

    await tokenContractUser.methods
      .redeem_shield(userAddress, amount, userSecret)
      .send()
      .wait();

    const balance = await tokenContractUser.methods
      .balance_of_private(userAddress)
      .view();

    return balance;
  }
  catch (error) {
    return null;
  }
}

// pass in deployed contract address as deployedContract.address
// used to get the balance of a user
export const getBalance = async (address: string) => {
  try {
    const userWallet = await getSchnorrWallet(
      pxe,
      AztecAddress.fromString(address),
      signingPrivateKey
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
  }
  catch (error) {
    return null;
  }
};

// Used to get the balance of the donation address
export const getDonationBalance = async () => {
  try {
    const contract = await Contract.at(
      deployedTokenContractAddress,
      TokenContractArtifact,
      adminWallet
    );

    const _balance = await contract.methods
      .balance_of_private(adminAddress)
      .view();

    return _balance;
  } catch (error) {
    return null;
  }
};

export const sendDonation = async (address: string, amount: number) => {
  try {
    const userWallet = await getSchnorrWallet(
      pxe,
      AztecAddress.fromString(address),
      signingPrivateKey
    );

    const contract = await Contract.at(
      deployedTokenContractAddress,
      TokenContractArtifact,
      userWallet
    );

    const _tx = await contract.methods
      .transfer(amount, adminAddress)
      .send()
      .wait();
    return _tx;
  } catch (error) {
    return null;
  }
}
