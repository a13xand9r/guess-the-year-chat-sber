import { Difference, YearEvent } from './types'
import { SaluteHandler } from '@salutejs/scenario'
import * as dictionary from './system.i18n'
import { compareYear, getPercentage, getUniqEvent, getYear, getYearDifference } from './utils/utils'
import { start } from './dataBase'

// let attempt = 0
// let oldQuestions: string[] = []
// export let currentEvent: YearEvent | null
// let firstAnswerYearDifference: number

export const runAppHandler: SaluteHandler = ({ req, res, session }) => {
    const keyset = req.i18n(dictionary)
    const helloText = keyset('Привет')
    res.setPronounceText(helloText)
    res.appendBubble(helloText)
    res.appendSuggestions(['Играть', 'Помощь'])
    res.setAutoListening(true)
    console.log('oldQuestions', session.oldQuestions)

    session.attempt = 0
    session.currentEvent = null
    if (!session.oldQuestions) session.oldQuestions = []

    start()
    // console.log(oldQuestions)
}

export const noMatchHandler: SaluteHandler = ({ req, res, session }) => {
    const keyset = req.i18n(dictionary)
    let errorText = ''
    if (session.currentEvent) {
        errorText = keyset('404')
    } else {
        errorText = keyset('Помощь')
    }
    res.setPronounceText(errorText)
    res.appendBubble(errorText)
    res.appendSuggestions(['Выйти'])
}


const startNewGame = (session: any) => {
    const event = getUniqEvent(session.oldQuestions ?? [])

    session.currentEvent = event
    session.attempt = 1
    session.oldQuestions.push(event.question)
}

export const startGameHandler: SaluteHandler = ({ req, res, session }) => {
    // const {currentEvent} = session as {currentEvent: YearEvent}
    console.log('startGameHandler')
    const keyset = req.i18n(dictionary)
    startNewGame(session)

    res.setPronounceText(keyset('Первый вопрос', {
        //@ts-ignore
        question: session.currentEvent?.question
    }))
    res.appendBubble(keyset('Первый вопрос', {
        //@ts-ignore
        question: session.currentEvent?.question
    }))
    res.setAutoListening(true)
    res.appendSuggestions(['Помощь', 'Выйти'])
}

export const userAnswerHandler: SaluteHandler = async ({ req, res, session }) => {
    const {currentEvent, attempt, firstAnswerYearDifference} = session as {
        currentEvent: YearEvent | undefined
        attempt: number
        firstAnswerYearDifference: number
    }

    const keyset = req.i18n(dictionary)
    const year = getYear(req.message.human_normalized_text)
    let responseText: string
    let percentage: number = 50

    const compareResult = compareYear(currentEvent?.year as number, year)
    if (compareResult !== Difference.good) {
        responseText = keyset(compareResult)
        session.attempt = attempt + 1
        if (session.attempt === 2) {
            responseText = responseText + ' ' + keyset('Еще ответ')
            session.firstAnswerYearDifference = getYearDifference(currentEvent?.year as number, year)
            getPercentage(currentEvent?.question as string, year, currentEvent?.year as number)
        }
        if (session.attempt === 3){
            const secondAnswerYearDifference = getYearDifference(currentEvent?.year as number, year)
            let accurateAnswer =secondAnswerYearDifference === firstAnswerYearDifference ? '' : secondAnswerYearDifference > firstAnswerYearDifference ? keyset('Первый точнее') : keyset('Второй точнее')
            responseText = `${responseText} ${accurateAnswer} ${keyset('Последний ответ')}`
            getPercentage(currentEvent?.question as string, year, currentEvent?.year as number)
        }
        if (session.attempt === 4){
            responseText = currentEvent?.description as string
            percentage = await getPercentage(currentEvent?.question as string, year, currentEvent?.year as number)
            console.log(percentage)
            startNewGame(session)
            responseText = responseText +
            '\n' +
            keyset('Точность ответа', {
                percentage
            }) +
            '\n\n' +
            keyset('Следующий вопрос', {
                //@ts-ignore
                question: session.currentEvent?.question
            })
        }
    } else {
        console.log(currentEvent?.description)
        responseText = keyset(compareResult, {
            description: currentEvent?.description
        })
        startNewGame(session)
        responseText = responseText +
            '\n\n' +
            keyset('Следующий вопрос', {
                //@ts-ignore
                question: session.currentEvent?.question
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
    res.appendSuggestions(['Продолжить', 'Выйти'])
}

export const continueHandler: SaluteHandler = ({ req, res, session }, dispatch) => {
    const keyset = req.i18n(dictionary)
    const {currentEvent} = session as {currentEvent: YearEvent | undefined}

    if (currentEvent) {
        const responseText = keyset('Вопрос', {
            question: currentEvent?.question
        })
        res.setPronounceText(responseText)
        res.appendBubble(responseText)
    } else {
        dispatch && dispatch(['StartGame'])
    }
}
