export const BASE_URL = 'https://api.playlive24.com'
//export const BASE_URL = 'http://localhost:3000'
//export const BASE_URL = 'https://72.61.140.55'

// export const BASE_URL = 'https://b0fd-139-135-36-92.ngrok-free.app'
export const BASE_URL_IMAGE = process.env.NEXT_PUBLIC_FILES_URL
export const API_END_POINTS = {
    /////////////////////////////<===MUTATIONS===>//////////////////////////////
    register: `${BASE_URL}/auth/create-user`,
    // createRvLead: BASE_URL + "api/rv-leads",
    login: `${BASE_URL}/auth/login`,
    changePassword: `${BASE_URL}/auth/update-password`,
    toggleUserStatus: `${BASE_URL}/auth/toggle-user-status/:targetUserId`,
    topupBalance: `${BASE_URL}/transfer/top-up/:targetUserId`,
    topDownBalance: `${BASE_URL}/transfer/top-down/:targetUserId`,
    // register: BASE_URL + "api/auth/register",
    // changePassword: BASE_URL + "api/auth/reset-password",
    // truckApplication: BASE_URL + "api/rv-leads/status",
    // forgotPassword: BASE_URL + "api/auth/forgot-password",
    // deleteTeamMember: BASE_URL + "api/users",
    // contactUs: BASE_URL + "api/contact-us",
    // createSlot: BASE_URL + "api/slots",
    // updateUser: BASE_URL + "api/users/update",
    // updateRvLeadSchedule: BASE_URL + "api/rv-leads/reschedule-inspection",
    
    /////////////////////////////<===QUERIES===>//////////////////////////////
    // getAllAvailableSlots: BASE_URL + "api/slots/available",
    // getTeamMembers: BASE_URL + "api/users/all",
    // getTeamMembersStats: BASE_URL + "api/auth/user-stats",
    // getAllAppointments: BASE_URL + "api/slots/appointments",
    // getSlotsStats: BASE_URL + "api/slots/stats",
    // getUser: BASE_URL + "api/users/me",
    
    /////////////////////////////<===SPORTS API===>//////////////////////////////
    // cricketMatches: BASE_URL + "/cricketid/matches/details/4",
    cricketMatches: `${BASE_URL}/cricketid/aggregator/cricket`,
    cricketMatchMarkets: `${BASE_URL}/cricketid/markets`,
    cricketMatchOdds: `${BASE_URL}/cricketid/odds`,
    cricketBookmakerFancy: `${BASE_URL}/cricketid/bookmaker-fancy`,
    cricketScorecard: `https://cache.tresting.com/v2/api/getScoreByEventId`,
    getAllSports: `${BASE_URL}/cricketid/sports`,
    // loginUser: BASE_URL + "api/auth/login",
    getUser: `${BASE_URL}/auth/subordinates`,
    getSingleUser: `${BASE_URL}/users/:userId`,
    getDashboardData: `${BASE_URL}/transfer/dashboard-summary`,

    /////////////////////////////<===BETTING===>//////////////////////////////
    placeBet: `${BASE_URL}/bf_placeBet_api`,

    /////////////////////////////<===WALLET===>//////////////////////////////
    getWallet: `${BASE_URL}/users/me/wallet`,

    /////////////////////////////<===SUPER ADMIN===>//////////////////////////////
    superAdminSelfTopup: `${BASE_URL}/transfer/superadmin/self-topup`,

    /////////////////////////////<===SETTLEMENT===>//////////////////////////////
    getPendingSettlements: `${BASE_URL}/admin/settlement/pending`,
    getPendingMarkets: `${BASE_URL}/admin/settlement/pending/markets`,
    getPendingFancyMarkets: `${BASE_URL}/admin/settlement/pending/fancy-markets`,
    getPendingBookmakerMarkets: `${BASE_URL}/admin/settlement/pending/bookmaker-markets`,
    getPendingTiedMatchMarkets: `${BASE_URL}/admin/settlement/pending/tied-match`,
    getPendingSettlementsByMatch: `${BASE_URL}/settlement/pending/match/:matchId`,
    getSettlementDetails: `${BASE_URL}/settlement/details`,
    getSettlementBets: `${BASE_URL}/settlement/bets`,
    getUserBets: `${BASE_URL}/admin/settlement/bets/user/:userId`,
    getMyPendingBets: `${BASE_URL}/settlement/bets/me/pending`,
    manualSettlement: `${BASE_URL}/settlement/manual/session-bet`,
    getallsettlementreport: `${BASE_URL}/settlement/results`,
    getSettlementHistory: `${BASE_URL}/admin/settlement/history`,
    reverseSettlement: `${BASE_URL}/settlement/reverse`,
    settleFancy: `${BASE_URL}/admin/settlement/fancy`,
    settleMatchOdds: `${BASE_URL}/admin/settlement/match-odds`,
    settleBookmaker: `${BASE_URL}/admin/settlement/bookmaker`,
    settleTiedMatch: `${BASE_URL}/admin/settlement/tied-match`,
    cancelBets: `${BASE_URL}/admin/settlement/cancel-bets`,
    rollbackSettlement: `${BASE_URL}/admin/settlement/rollback`,
    deleteBet: `${BASE_URL}/admin/settlement/bet/:betId`,

    /////////////////////////////<===ADMIN MATCHES===>//////////////////////////////
    getAdminMatches: `${BASE_URL}/admin/matches`,
    toggleMatchVisibility: `${BASE_URL}/admin/matches/:eventId`,

    /////////////////////////////<===SITE VIDEO===>//////////////////////////////
    getSiteVideo: `${BASE_URL}/site-video`,
    updateSiteVideo: `${BASE_URL}/site-video`,

    /////////////////////////////<===POSITIONS===>//////////////////////////////
    getMatchPositions: `${BASE_URL}/positions`,

    /////////////////////////////<===ACCOUNT STATEMENT===>//////////////////////////////
    getAccountStatement: `${BASE_URL}/client/account-statement`,

    /////////////////////////////<===BET AGGREGATION===>//////////////////////////////
    getBetAggregation: `${BASE_URL}/admin/settlement/bet-aggregation`,
 
}
