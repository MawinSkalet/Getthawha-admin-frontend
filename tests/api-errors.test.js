import {afterEach,it,expect} from "bun:test";
import {getAllBooking,updateBookingById} from "../src/hooks/useBooking";
import {deleteReview} from "../src/hooks/useReview";
const original=globalThis.fetch;afterEach(()=>{globalThis.fetch=original});
const forbidden=()=>{globalThis.fetch=async()=>new Response(JSON.stringify({error:"Session expired"}),{status:403});};
it("does not parse forbidden bookings as a successful list",async()=>{forbidden();expect(await getAllBooking(1,new AbortController().signal)).toEqual({status:"error",message:"Session expired"});});
it("does not show a forbidden review deletion as successful",async()=>{forbidden();expect((await deleteReview("id",new AbortController().signal)).status).toBe("error");});
it("does not show forbidden booking updates as successful",async()=>{forbidden();expect((await updateBookingById("id",{date:"2099-01-01"},new AbortController().signal)).status).toBe("error");});
