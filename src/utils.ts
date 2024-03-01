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
import {
  TokenContract,
  TokenContractArtifact,
} from "@aztec/noir-contracts.js/Token";

// import { AztecAddress } from "@aztec/foundation";

import 'dotenv/config';

const PXE_URL = process.env.PXE_URL || "http://localhost:8080";
const encryptionPrivateKey = GrumpkinScalar.random();
const signingPrivateKey = GrumpkinScalar.random();
const pxe = createPXEClient(PXE_URL);

const accounts = await getDeployedTestAccountsWallets(pxe);

const private_key = process.env.ADMIN_SIGNING_PRIVATE_KEY || ""

const adminSigningPrivateKey = GrumpkinScalar.fromString(private_key);

const adminWallet = await getSchnorrWallet(
  pxe,
  accounts[0].getAddress(),
  adminSigningPrivateKey
);

const adminAddress = adminWallet.getAddress();

// change this deployedContract.address
const deployedTokenContractAddress = AztecAddress.fromString(
  "0x2fd4503a9b855a852272945df53d7173297c1469cceda31048b85118364b09a3"
);

// const deployedContract = await TokenContract.deploy(
//   wallet, // wallet instance
//   wallet.getAddress(), // account
//   "ANON Token", // constructor arg1
//   "ANON", // constructor arg2
//   18
// ) // constructor arg3
//   .send()
//   .deployed();

export const createAztecAccount = async () => {
  try {
    const userWallet = await getSchnorrAccount(
      pxe,
      encryptionPrivateKey,
      signingPrivateKey
    ).waitDeploy();

    return userWallet.getAddress();
  } catch (error) {
    return null;
  }
}

export const addMinter = async (address: string) => {
  try {
    const contract = await Contract.at(
      deployedTokenContractAddress,
      TokenContractArtifact,
      adminWallet
    );

    // caller has to be an admin
    await contract.methods
      .set_minter(AztecAddress.fromString(address), true)
      .send()
      .wait();

    return true;
  } catch (error) {
    return null;
  }
};

export const mintTokens = async (address: string) => {
  // return "ugvbnm";

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

  // User wants to mint some funds, the contract is already deployed, create an abstraction and link it to the user wallet
  // Since we already have a token link, we can simply create a new instance of the contract linked to user's wallet
  const tokenContractUser = contract.withWallet(userWallet);

  const userAddress = userWallet.getAddress();

  const pendingShieldsStorageSlot = new Fr(5); // The storage slot of `pending_shields` is 5.
  const noteTypeId = new Fr(84114971101151129711410111011678111116101n); // TransparentNote

  // caller has to be an admin
  // await contract.methods.set_minter(userAddress, true).send().wait();

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
      contract.address,
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