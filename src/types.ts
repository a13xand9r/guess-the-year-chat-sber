import {
    AppState,
    SaluteRequest,
    SaluteRequestVariable
} from '@salutejs/scenario'


export type CustomRequest = SaluteRequest<SaluteRequestVariable, AppState>

export type YearEvent = {
    question: string
    year: number
    description: string
}

export enum Difference {
    earlier = 'Раньше',
    littleEarlier = 'Немного раньше',
    mostEarlier = 'Сильно раньше',
    later = 'Позже',
    littleLater = 'Немного позже',
    mostLatter = 'Сильно позже',
    good = 'Верно'
}