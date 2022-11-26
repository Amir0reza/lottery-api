import { Injectable } from "@nestjs/common"
import { ethers } from "ethers"
import { readFileSync } from "fs-extra"

import * as Lottery_Json from "./assets/Lottery.json"
import * as PAYMENT_TOKEN_JSON from "./assets/LotteryTokenClassic.json"
import * as contract_addresses from "./assets/contract-addresses.json"

const Lottery_ADDRESS = contract_addresses.LOTTERY_ADDRESS
const PAYMENT_TOKEN_ADDRESS = contract_addresses.PAYMENT_TOKEN_ADDRESS

const encryptedJson =
    readFileSync("./encrypted-publicTest.json", "utf8") || "emptry"
let PRIVATE_KEY: string
const PASSWORD: string = process.env.WAL_PASS || "No pass provided"

if (PASSWORD != "No pass provided") {
    PRIVATE_KEY = ethers.Wallet.fromEncryptedJsonSync(
        encryptedJson,
        PASSWORD,
    ).privateKey
} else if (process.env.PRIVATE_KEY) {
    PRIVATE_KEY = process.env.PRIVATE_KEY
} else {
    PRIVATE_KEY =
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
}

export class OpenBetsDTO {
    "ClosingTimeStamp": number
    "counter": string
    "signature": string
}

@Injectable()
export class AppService {
    provider: ethers.providers.Provider
    wallet: ethers.Wallet

    lottery: ethers.Contract
    paymentToken: ethers.Contract

    abiCoder: ethers.utils.AbiCoder
    counterTokenRequest: number

    LOTTERY_ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("LOTTERY_ADMIN_ROLE")),
    )

    constructor() {
        this.provider = ethers.providers.getDefaultProvider("goerli", {
            etherscan: process.env.ETHERSCAN_API_KEY,
            infura: process.env.INFURA_API_KEY,
            alchemy: process.env.ALCHEMY_API_KEY,
            pocket: process.env.POCKET_API_KEY,
        })
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider)
        this.lottery = new ethers.Contract(
            Lottery_ADDRESS,
            Lottery_Json.abi,
            this.wallet,
        )
        this.paymentToken = new ethers.Contract(
            PAYMENT_TOKEN_ADDRESS,
            PAYMENT_TOKEN_JSON.abi,
            this.wallet,
        )
        this.abiCoder = new ethers.utils.AbiCoder()
        this.counterTokenRequest = 0
    }

    getLotteryAddress(): string {
        return this.lottery.address
    }

    getPaymentTokenAddress(): string {
        return this.paymentToken.address
    }

    openBets(openBetsDTO: OpenBetsDTO): string {
        const messageHash = ethers.utils.keccak256(
            this.abiCoder.encode(
                ["uint256", "uint256"],
                [openBetsDTO.ClosingTimeStamp, this.counterTokenRequest],
            ),
        )

        const expectedSigner = ethers.utils.verifyMessage(
            messageHash,
            openBetsDTO.signature,
        )

        let isAdmin: boolean
        this.lottery
            .hasRole(this.LOTTERY_ADMIN_ROLE, expectedSigner)
            .then((ans: boolean) => {
                isAdmin = ans
            })

        let currentTimestamp: number
        this.provider.getBlock("latest").then((currentBlock) => {
            currentTimestamp = currentBlock.timestamp
        })

        let betsClosed: boolean
        this.lottery.getBetsOpen().then((ans) => {
            betsClosed = !ans
        })

        if (isAdmin && currentTimestamp < openBetsDTO.ClosingTimeStamp && betsClosed) {
            this.lottery
                .openBets(openBetsDTO.ClosingTimeStamp)
                .then(
                    (
                        txResponse: ethers.ContractTransaction,
                    ): string => {
                        this.counterTokenRequest += 1
                        return txResponse.hash
                    },
                )
        } else {
            return "0x0000000000000000000000000000000000000000000000000000000000000000"
        }
    }
}
