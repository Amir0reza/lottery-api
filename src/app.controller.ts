import { Controller, Get, Post, Body } from "@nestjs/common"
import { AppService, OpenBetsDTO } from "./app.service"

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get("lottery-address")
    getLotteryAddress() {
        return { result: this.appService.getLotteryAddress() }
    }

    @Get("peyment-token-address")
    getPaymentTokenAddress() {
        return { result: this.appService.getPaymentTokenAddress() }
    }

    @Post("request-open-bets")
    openBets(@Body() openBetsDTO: OpenBetsDTO) {
        return { result: this.appService.openBets(openBetsDTO) }
    }
}
