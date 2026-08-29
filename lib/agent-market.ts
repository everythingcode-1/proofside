import { currentMarket } from "./dreamdex"

type MarketLoader = typeof currentMarket
let loader: MarketLoader = currentMarket

export const loadAgentMarket = () => loader()
export const setAgentMarketLoaderForTests = (next?: MarketLoader) => { loader = next ?? currentMarket }
