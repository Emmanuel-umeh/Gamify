const contractSource = `
contract GameDev =
  
    
  record games = 
    {
    creatorAddress : address,
    imageUrl : string,
    name : string,
    price : int
    }
    
  record state = {
    game : map(int, games),
    gameLength : int}
    
  entrypoint init() = { 
    game = {},
    gameLength = 0}

  
  entrypoint getGame(index : int) = 
    switch(Map.lookup(index, state.game))
      None => abort("Game does not exist with this index")
      Some(x) => x  
    
    
    //create a game
    
  stateful entrypoint sellGame( imageUrl' : string, name' : string, price' : int) = 
    let newGame = {
      creatorAddress  = Call.caller,
      imageUrl = imageUrl',
      name = name', 
      price = price'}
    let index = getGameLength() + 1
    put(state{game[index] = newGame, gameLength = index})
    
    
    //returns lenght of games registered
  entrypoint getGameLength() : int = 
    state.gameLength
 
    `; 


const contractAddress = 'ct_2R1TLCKVVqgRRJgiAEXMof6rv8crUKSq67hoB7PT7aDQ1QHoi6';
var GameArray = [];
var client = null;
var gameLength = 0;



function renderProduct()
{
    GameArray = GameArray.sort(function(a,b){return b.Price - a.Price})
    var template = $('#template').html();
    
    Mustache.parse(template);
    var rendered = Mustache.render(template, {GameArray});

    
  

    $('#body').html(rendered);
    console.log("for loop reached")
}
//Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
  //Create a new contract instance that we can interact with
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to get data of smart contract func, with specefied arguments
  console.log("Contract : ", contract)
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
  //Make another call to decode the data received in first call
  console.log("Called get found: ",  calledGet)
  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  console.log("catching errors : ", decodedGet)
  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {amount:value}).catch(e => console.error(e));

  return calledSet;
}

window.addEventListener('load', async () => {
  $("#loadings").show();

  client = await Ae.Aepp()

  gameLength = await callStatic('getGameLength', []); 

  for(let i = 1; i<= gameLength ; i++ ){
    const games =  await callStatic('getGame', [i]);
    
    console.log("for loop reached", "pushing to array")
    console.log(games.imageUrl)
    console.log(games.name)
    console.log(games.price)
    

    GameArray.push({
        imageUrl : games.imageUrl,
        name : games.name, 
        price : games.price
        

     
  })
}
  renderProduct();
  $("#loadings").hide();
});



$('#regButton').click(async function(){
  $("#loadings").show();

    var name =($('#name').val()),
    
    url = ($('#imageUrl').val()),
   
    price = ($('#price').val());
    prices = parseInt(price,10)
    await contractCall('sellGame', [url,name,prices], prices)
   
    console.log(url)
    console.log(name)
    console.log(prices)
    console.log(typeof(prices))
   

    
    GameArray.push({
        name : name,
        url : url,
        price : prices,

        
        
    })
    renderProduct();
    $("#loadings").hide();
});