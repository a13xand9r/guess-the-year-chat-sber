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
import { continueHandler, helpHandler, noMatchHandler, runAppHandler, startGameHandler, userAnswerHandler } from './handlers'
import model from './intents.json'
import { closeApp } from './utils/utils'

const storage = new SaluteMemoryStorage()
const intents = createIntents(model.intents)
const { intent } = createMatchers<SaluteRequest, typeof intents>()

const userScenario = createUserScenario({
    StartGame: {
        match: (req) => intent('/Начать игру', {confidence: 0.2})(req),
        handle: startGameHandler,
        children: {
            No: {
                match: (req) => intent('/Нет', {confidence: 0.2})(req),
                handle: ({res}) => {
                    res.setPronounceText('Тогда до скорых встреч')
                    closeApp(res.message)
                }
            },
        }
    },
    UserAnswer: {
        match: (req) => req.message.normalized_text.includes('NUM_TOKEN'),
        handle: userAnswerHandler
    },
    Help: {
        match: intent('/Помощь', {confidence: 0.2}),
        handle: helpHandler
    },
    Continue: {
        match: intent('/Продолжить', {confidence: 0.2}),
        handle: continueHandler
    }
})

const systemScenario = createSystemScenario({
    RUN_APP: runAppHandler,
    NO_MATCH: noMatchHandler
})

const scenarioWalker = createScenarioWalker({
    recognizer: new SmartAppBrainRecognizer('dcedf81f-690b-4c8a-b947-541feea36c13'),
    intents,
    systemScenario,
    userScenario
})

export const handleNlpRequest = async (request: NLPRequest): Promise<NLPResponse> => {
    const req = createSaluteRequest(request)
    const res = createSaluteResponse(request)
    const sessionId = request.uuid.sub
    const session = await storage.resolve(sessionId)
    await scenarioWalker({ req, res, session })

    await storage.save({ id: sessionId, session })

    return res.message
}