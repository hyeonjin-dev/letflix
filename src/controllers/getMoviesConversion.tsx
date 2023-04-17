const getMoviesConversion = async (movieList) => {
  const requests = movieList.map((movie) => (fetch(`${process.env.SEARCH_MOVIE}?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(movie.movieNm)}&language=ko&include_adult=true&page=1`)))
  const responses = await Promise.all(requests)
  const jsonData = await Promise.all(responses.map((response) => response.json()))
  const data = []

  for(let dataItem of jsonData){data.push(dataItem?.results[0])}
  const dataObj = {result: data}
  
  return dataObj
}

export default getMoviesConversion