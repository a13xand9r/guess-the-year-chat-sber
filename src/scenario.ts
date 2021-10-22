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
import { continueHandler, currentEvent, helpHandler, noMatchHandler, runAppHandler, startGameHandler, userAnswerHandler } from './handlers'
import model from './intents.json'

const storage = new SaluteMemoryStorage()
const intents = createIntents(model.intents)
const { intent } = createMatchers<SaluteRequest, typeof intents>()

const userScenario = createUserScenario({
    StartGame: {
        match: (req) => intent('/Начать игру', {confidence: 0.2})(req) && !currentEvent,
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
    Continue: {
        match: intent('/Продолжить', {confidence: 0.2}),
        handle: continueHandler
    },
    No: {
        match: (req) => intent('/Нет', {confidence: 0.2})(req) && !currentEvent,
        handle: ({res}) => {
            res.setPronounceText('Ну и ладно')
        }
    },
})

const systemScenario = createSystemScenario({
    RUN_APP: runAppHandler,
    NO_MATCH: noMatchHandler
})

const scenarioWalker = createScenarioWalker({
    recognizer: new SmartAppBrainRecognizer('c4ac45a8-bc54-4779-bf57-4eb69a387b5b'),
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