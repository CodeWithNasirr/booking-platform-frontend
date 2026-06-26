import home from "./provider/home"
import service from "./provider/service"
import orders from "./provider/orders"
import booking from "./provider/booking"
import availability from "./provider/availability"
import profile from "./provider/profile"
import work from "./provider/work"


export default {
    ...home,
    ...service,
    ...orders,
    ...booking,
    ...availability,
    ...profile,
    ...work,
}