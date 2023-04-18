import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import getMoviesConversion from "./getMoviesConversion";

//날짜 계산
const dateCalc = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2,'0')
  //어제 날짜 계산
  const day = String(date.getDate()-1).padStart(2,'0')
  return `${year}${month}${day}`
}

//api urls
const urls = [
  //한국 영화 konfig api (한국의 박스오피스 불러오는 용도로 사용)
  `${process.env.DAILY_BOX_OFFICE}?key=${process.env.KONFIC_KEY}&targetDt=${dateCalc()}&itemPerPage=10`,

  //외국 영화 tmdb api (메인 api로 사용)
  `${process.env.POPULAR_MOVIE}?api_key=${process.env.TMDB_KEY}&language=ko&page=`,
]

//fetch요청 작성.
const fetchRequests = [fetch(urls[0])]

//tmdb api의 불러오고 싶은 page 숫자만큼 반복문 설정.
for(let i=0; i<10; i++){
  fetchRequests.push(
    fetch(urls[1] + String(i+1))
  )
}

//비동기 실행 thunk
export const getMoviesData = createAsyncThunk("movies/getMoviesData", async () => {
  //여러 개의 fetch요청을 동시에 수행하기 위해 promise.all 사용
  const responses = await Promise.all(fetchRequests)
  const jsonData = await Promise.all(responses.map((response) => response.json()))
  let data = [...jsonData]

  //konfig api의 json data는 getMoviesConversion를 통해 tmdb api와 같은 형식으로 변환
  data[0] = await getMoviesConversion(jsonData[0]?.boxOfficeResult?.dailyBoxOfficeList)
  return data
})

//state 초기 값
interface MoviesData {
  dailyBoxOffice: []
  allMovies: []
  }
  
interface InitialState {
  moviesData: MoviesData
}

const initialState: InitialState = {
  moviesData: {
    dailyBoxOffice : [],
    allMovies: []
  }
}

const moviesDataSlice = createSlice({
  name: "moviesData",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
    .addCase(getMoviesData.pending, (state) => {
      //fetch되기 전 수행할 action 작성
      console.log('로딩중..')
    })

    .addCase(getMoviesData.fulfilled, (state, action) => {
      //fetch성공 후 수행할 action 작성

      console.log(action.payload)
      //boxOffice만 따로 별개의 state로 관리
      const dailyUpdate = action.payload[0]?.results
      state.moviesData.dailyBoxOffice = dailyUpdate

      //각각 fetch해온 모든 movie data를 하나의 배열로 합침
      const mergeData = action.payload.reduce((acc, movieList) => {
        return [...acc, ...movieList.results]
      }, [])

      //중복되는 konfig api data 제거
      const setData = mergeData.slice(1)
      state.moviesData.allMovies = setData
    })

    .addCase(getMoviesData.rejected, (state) => {
      //fetch 실패 시 수행할 action 작성
      console.log('실패 ㅠㅠ')
    })
  },
})

export default moviesDataSlice.reducer