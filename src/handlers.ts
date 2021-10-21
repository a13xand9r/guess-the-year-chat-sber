import { Difference, YearEvent } from './types'
import { SaluteHandler } from '@salutejs/scenario'
import * as dictionary from './system.i18n'
import { compareYear, getPercentage, getUniqEvent, getYear } from './utils/utils'
import { start } from './dataBase'

let attempt = 0
let oldQuestions: string[] = []
let currentEvent: YearEvent | null

export const runAppHandler: SaluteHandler = ({ req, res }, dispatch) => {
    const keyset = req.i18n(dictionary)
    const helloText = keyset('Привет')
    res.setPronounceText(helloText)
    res.appendBubble(helloText)
    res.appendSuggestions(['Играть', 'Помощь'])
    start()
}

export const noMatchHandler: SaluteHandler = ({ req, res }) => {
    console.log('human_normalized_text', req.message.human_normalized_text)
    console.log('normalized_text', req.message.normalized_text)
    console.log('asr_normalized_message', req.message.asr_normalized_message)
    const keyset = req.i18n(dictionary)
    const errorText = keyset('404')
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
}

export const userAnswerHandler: SaluteHandler = async ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const year = getYear(req.message.human_normalized_text)
    let responseText: string
    let percentage: number = 50

    if (attempt < 3) {
        attempt += 1
        const compareResult = compareYear(currentEvent?.year as number, year)
        if (compareResult !== Difference.good){
            responseText = keyset(compareResult)
            if (attempt === 2) responseText = responseText + ' ' + keyset('Еще ответ')
            if (attempt === 3) responseText = responseText + ' ' + keyset('Последний ответ')
        } else {
            responseText = keyset(compareResult, {
                description: currentEvent?.description
            })
            percentage = await getPercentage(currentEvent?.question as string, year, currentEvent?.year as number)
            startNewGame()
        }
    } else {
        responseText = currentEvent?.description as string
        percentage = await getPercentage(currentEvent?.question as string, year, currentEvent?.year as number)
        startNewGame()
    }
    if (attempt === 1) {
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
    res.setPronounceText(responseText)
    res.appendBubble(responseText)
    res.appendSuggestions(['Помощь', 'Выйти'])
}

export const helpHandler: SaluteHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Помощь')
    res.setPronounceText(responseText)
    res.appendBubble(responseText)
}
