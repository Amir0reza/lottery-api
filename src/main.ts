import { NestFactory } from "@nestjs/core"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    const corsOptions = {
        origin: "*",
        method: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
        allowedHeaders: "Content-Type, Accept, Authorization"
    }
    app.enableCors(corsOptions)

    const config = new DocumentBuilder()
        .setTitle("API for lottery")
        .setDescription("An API for lottery contract")
        .setVersion("1.0")
        .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup("api", app, document)

    await app.listen(3000)
}
bootstrap()
