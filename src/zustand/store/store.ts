import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { 
    createAdminSlice,
    createStaffSlice,
 } from '../slices';
import { AdminSlice } from '../slices/admin';
import { StaffSlice } from '../slices/employee';

type TAppSlices = AdminSlice & StaffSlice;
const useStore = create<TAppSlices>()(
    devtools(
        persist(
            (...args) => ({
              ...createAdminSlice(...args),
              ...createStaffSlice(...args)
            }),
            {
              name: 'SWAPCARD',
            },
          ),
    )
)

export default useStore