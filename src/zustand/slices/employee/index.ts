/* eslint-disable @typescript-eslint/no-explicit-any */
import { type StateCreator } from "zustand/vanilla";

interface StaffState {
    loading?:boolean;
    info?: any | null;
    type?:'admin' | 'employee';
    isAuthenticated?:boolean;
}
export interface StaffSlice{
    staff: StaffState | null;
    saveStaffInfo:(payload:any) => void;
    logoutStaff: () => void;
}

const initialState: StaffState ={
    loading:false,
    info:null,
    isAuthenticated:false
}

const createStaffSlice: StateCreator<StaffSlice> = (set) => ({
    staff: initialState,
    saveStaffInfo:async(payload:any) =>{
      set((state) => ({
        ...state,
        staff: {
          ...state.staff,
          info: payload,
          type:'employee',
          isAuthenticated:true
        },
      }));
    },
    logoutStaff:async() =>{
        try {
            set(() => ({
                staff: initialState, 
            }));
          } catch (error) {
            console.error('Logout error:', error);
          }
    },
})

export default createStaffSlice