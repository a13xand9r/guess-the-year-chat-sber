import { yearData } from './yearEventsData';
import { Difference } from './../types';
import { getUsersYear } from '../dataBase';

export function getRandomFromArray<T>(arr: T[]): T {
    return arr[Math.floor(arr.length * Math.random())]
}

export function getUniqEvent(oldQuestions: string[]) {
    let event = getRandomFromArray(yearData)
    let foundQuestion = oldQuestions.find(item => item === event.question)

    while (foundQuestion) {
        event = getRandomFromArray(yearData)
        foundQuestion = oldQuestions.find(item => item === event.question)
    }
    return event
}

function randomInteger(min: number, max: number) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

export async function getPercentage(question: string, userYear: number, realYear: number) {
    const usersYear = await getUsersYear(question, userYear)
    if (usersYear.length < 4 || !usersYear) return randomInteger(30, 70)
    const userYearDifference = Math.abs(realYear - userYear)
    const otherUsersYearDifference = usersYear.map(item => Math.abs(item - realYear))
    const badOtherUsersYearDifference = otherUsersYearDifference.filter(item => item > userYearDifference)
    return Math.round(badOtherUsersYearDifference.length / otherUsersYearDifference.length * 100)
}

export function getYear(human_normalized_text: string) {
    const humanNormalizedTextArr = human_normalized_text.split(' ')
    for (let i = 0; i < humanNormalizedTextArr.length; i++) {
        if (Number(humanNormalizedTextArr[i])) {
            return Number(humanNormalizedTextArr[i])
        }
    }
    return 0
}

export function compareYear(realYear: number, userYear: number) {
    const yearDifference = realYear - userYear
    if (yearDifference > 0) {
        if (yearDifference < 20) return Difference.littleLater
        if (yearDifference > 20 && yearDifference < 100) return Difference.later
        if (yearDifference > 100) return Difference.mostLatter
    } else if (yearDifference < 0) {
        if (Math.abs(yearDifference) < 20) return Difference.littleEarlier
        if (Math.abs(yearDifference) > 20 && Math.abs(yearDifference) < 100) return Difference.earlier
        if (Math.abs(yearDifference) > 100) return Difference.mostEarlier
    } else return Difference.good
    return Difference.good
}

export function getYearDifference(realYear: number, userYear: number) {
    return Math.abs(realYear - userYear)
}

