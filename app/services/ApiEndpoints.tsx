export const BASE_URL = 'https://api.playlive24.com'
// export const BASE_URL = 'https://b0fd-139-135-36-92.ngrok-free.app'
export const BASE_URL_IMAGE = process.env.NEXT_PUBLIC_FILES_URL


export const API_END_POINTS = {
    /////////////////////////////<===MUTATIONS===>//////////////////////////////
    register: `${BASE_URL}/auth/create-user`,
    // createRvLead: BASE_URL + "api/rv-leads",
    login: `${BASE_URL}/auth/login`,
    topupBalance: `${BASE_URL}/transfer/top-up/:targetUserId`,
    topDownBalance: `${BASE_URL}/transfer/top-down/:targetUserId`,
    getUser: `${BASE_URL}/auth/subordinates`,
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
    cricketMatches: BASE_URL + "/entitysport/matches"
    // loginUser: BASE_URL + "api/auth/login",
    
}
