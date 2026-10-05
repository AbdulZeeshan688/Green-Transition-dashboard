import TestScreen from "../components/TestScreen/TestScreen"
import MiddleScreen from "../components/MiddleScreen/MiddleScreen"
import WheelScreen from "../components/WheelScreen/WheelScreen"

export default function Home() {
  return (
	  <>
	  <div className="flex h-dvh items-center justify-center gap-6 p-6">
		  <div className="flex h-full shrink-0 flex-col gap-4">
			  <div className="h-[calc(50%-0.5rem)] aspect-[19.5/9] rounded-3xl bg-gray-200">
			     <WheelScreen></WheelScreen>
			  </div>

			  <div className="h-[calc(50%-0.5rem)] aspect-[19.5/9] rounded-3xl bg-gray-200">

			   <TestScreen></TestScreen>
			  </div>
		  </div>

		  <div className="h-full shrink-0 aspect-[3/4] rounded-3xl bg-gray-300">
		   <MiddleScreen></MiddleScreen>
		  </div>
	  </div>
	  </>
  );
}
