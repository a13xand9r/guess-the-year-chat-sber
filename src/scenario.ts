import { SmartAppBrainRecognizer } from '@salutejs/recognizer-smartapp-brain'
import {
    createIntents,
    createMatchers,
    createSaluteRequest,
    createSaluteResponse,
    createScenarioWalker,
    createSystemScenario,
    createUserScenario,
    NLPRequest,
    NLPResponse,
    SaluteRequest
} from '@salutejs/scenario'
import { SaluteMemoryStorage } from '@salutejs/storage-adapter-memory'
import { helpHandler, noMatchHandler, runAppHandler, startGameHandler, userAnswerHandler } from './handlers'
import model from './intents.json'
// require('dotenv').config()

const storage = new SaluteMemoryStorage()
const intents = createIntents(model.intents)
const { match, intent } = createMatchers<SaluteRequest, typeof intents>()

const userScenario = createUserScenario({
    StartGame: {
        match: intent('/Начать игру', {confidence: 0.2}),
        handle: startGameHandler
    },
    UserAnswer: {
        match: (req) => req.message.normalized_text.includes('NUM_TOKEN'),
        handle: userAnswerHandler
    },
    Help: {
        match: intent('/Помощь', {confidence: 0.2}),
        handle: helpHandler
    },
})

const systemScenario = createSystemScenario({
    RUN_APP: runAppHandler,
    NO_MATCH: noMatchHandler
})

const scenarioWalker = createScenarioWalker({
    recognizer: new SmartAppBrainRecognizer(process.env.NEXT_PUBLIC_SMART_BRAIN),
    intents,
    systemScenario,
    userScenario
})

export const handleNlpRequest = async (request: NLPRequest): Promise<NLPResponse> => {
    const req = createSaluteRequest(request)
    const res = createSaluteResponse(request)
    const sessionId = request.uuid.userId
    const session = await storage.resolve(sessionId)
    await scenarioWalker({ req, res, session })

    await storage.save({ id: sessionId, session })

    return res.message
}