import { Difference, YearEvent } from './types'
import { SaluteHandler } from '@salutejs/scenario'
import * as dictionary from './system.i18n'
import { compareYear, getPercentage, getUniqEvent, getYear } from './utils/utils'
import { start } from './dataBase'

let attempt = 0
let oldQuestions: string[] = []
let currentEvent: YearEvent | null

export const runAppHandler: SaluteHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const helloText = keyset('Привет')
    res.setPronounceText(helloText)
    res.appendBubble(helloText)
    res.appendSuggestions(['Играть', 'Помощь'])
    start()
}

export const noMatchHandler: SaluteHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    let errorText = ''
    if (currentEvent) {
        errorText = keyset('404')
    } else {
        errorText = keyset('Помощь')
    }
    res.setPronounceText(errorText)
    res.appendBubble(errorText)
}


const startNewGame = () => {
    const event = getUniqEvent(oldQuestions)

    currentEvent = event
    attempt = 1
    oldQuestions.push(event.question)
}

export const startGameHandler: SaluteHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    startNewGame()

    res.setPronounceText(keyset('Первый вопрос', {
        question: currentEvent?.question
    }))
    res.appendBubble(keyset('Первый вопрос', {
        question: currentEvent?.question
    }))
    res.setAutoListening(true)
}

export const userAnswerHandler: SaluteHandler = async ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const year = getYear(req.message.human_normalized_text)
    let responseText: string
    let percentage: number = 50

    const compareResult = compareYear(currentEvent?.year as number, year)
    if (compareResult !== Difference.good) {
        responseText = keyset(compareResult)
        attempt += 1
        if (attempt === 2) responseText = responseText + ' ' + keyset('Еще ответ')
        if (attempt === 3) responseText = responseText + ' ' + keyset('Последний ответ')
        if (attempt === 4){
            responseText = currentEvent?.description as string
            percentage = await getPercentage(currentEvent?.question as string, year, currentEvent?.year as number)
            startNewGame()
            responseText = responseText +
            '\n' +
            keyset('Точность ответа', {
                percentage
            }) +
            '\n\n' +
            keyset('Следующий вопрос', {
                question: currentEvent?.question
            })
        }
    } else {
        console.log(currentEvent?.description)
        responseText = keyset(compareResult, {
            description: currentEvent?.description
        })
        startNewGame()
        responseText = responseText +
            '\n\n' +
            keyset('Следующий вопрос', {
                question: currentEvent?.question
            })
    }
    res.setPronounceText(responseText)
    res.appendBubble(responseText)
    res.appendSuggestions(['Помощь', 'Выйти'])
    res.setAutoListening(true)
}

export const helpHandler: SaluteHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Помощь')
    res.setPronounceText(responseText)
    res.appendBubble(responseText)
    res.appendSuggestions(['Продолжить'])
}

export const continueHandler: SaluteHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Вопрос', {
        question: currentEvent?.question
    })
    res.setPronounceText(responseText)
    res.appendBubble(responseText)
}
