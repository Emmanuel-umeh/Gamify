const contractSource = `
contract Gamify =

  record game = {
    id:int,
    name: string,
    price:int,
    purchased:int,
    description : string,
    images:string,
    owner:address
    
    }
  
  
  record state = 
    {
      gameLength : int,
      games : map(int, game)
    }
  
  entrypoint init() = 
    { games = {}, 
      gameLength = 0}
  
    
  entrypoint getGameLength() : int = 
    state.gameLength
  
  stateful entrypoint addGame(_name:string, _price:int, _images:string, _description : string ) =
    let game = {id=getGameLength() + 1, name=_name, price=_price, description = _description, images=_images,purchased=0, owner=Call.caller}
    let index = getGameLength() + 1
    put(state{games[index] = game, gameLength  = index})

  
  entrypoint get_game_by_index(index:int) : game = 
    switch(Map.lookup(index, state.games))
      None => abort("Game does not exist with this index")
      Some(x) => x  
  
  payable stateful entrypoint buyGame(_id:int)=
    let game = get_game_by_index(_id) // get the current game with the id
    
    let  _seller  = game.owner : address
    
    require(game.id > 0,abort("NOT A GAME ID"))
    
    // require that there is enough AE in the transaction
    require(Call.value >= game.price,abort("You Don't Have Enough AE"))
    
  

    
    // require that the buyer is not the seller
    
    require(_seller != Call.caller,"SELLER CAN'T PURCHASE HIS ITEM")
    
    // transfer ownership
    
    //game.owner = Call.caller
    
    
    
   
    
    // update the game
    let updated_game = {id=game.id, name=game.name, price=game.price, images=game.images, description = game.description, purchased = game.purchased + 1, owner=Call.caller}
    
    put(state{games[_id] = updated_game})
    
    // sends the amount
    
    Chain.spend(_seller, Call.value)
 
    `;




const contractAddress = 'ct_Aa4t6WDrWGXaVkgCfMBmj1pyVEkVk4DrBgcGfzqwNu1gvdj1T';
var GameArray = [];
var SoldArray = []
var client = null;
var gameLength = 0;





function renderProduct() {
  GameArray = GameArray.sort(function (a, b) {
    return b.Price - a.Price
  })
  var template = $('#template').html();

  Mustache.parse(template);
  var rendered = Mustache.render(template, {
    GameArray
  });




  $('#body').html(rendered);
  console.log("for loop reached")
}
//Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
  //Create a new contract instance that we can interact with
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to get data of smart contract func, with specefied arguments
  console.log("Contract : ", contract)
  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));
  //Make another call to decode the data received in first call
  console.log("Called get found: ", calledGet)
  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  console.log("catching errors : ", decodedGet)
  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {
    amount: value
  }).catch(e => console.error(e));

  return calledSet;
}

window.addEventListener('load', async () => {
  $("#loadings").show();

  client = await Ae.Aepp()

  gameLength = await callStatic('getGameLength', []);



  for (let i = 1; i <= gameLength; i++) {
    const games = await callStatic('get_game_by_index', [i]);

      console.log("for loop reached", "pushing to array")
      console.log(games.images)
      console.log(games.name)
      console.log(games.price)



      GameArray.push({
        id: games.id,
        imageUrl: games.images,
        name: games.name,
        price: games.price,
        purchased: games.purchased

      })
    }

    renderProduct();
    $("#loadings").hide();
  });



$('#regButton').click(async function () {
  $("#loadings").show();

  var name = ($('#name').val()),

    url = ($('#imageUrl').val()),

    price = ($('#price').val());

  description = ($('#description').val());
  prices = parseInt(price, 10)
  await contractCall('addGame', [name, prices, url, description], prices)

  console.log(url)
  console.log(name)
  console.log(prices)
  console.log(typeof (prices))



  GameArray.push({
    id: GameArray.id + 1,
    name: name,
    url: url,
    price: prices,
    description: description



  })
  renderProduct();
  $("#loadings").hide();
});

$("#body").click(".btn", async function (event) {
  $("#loadings").show();
  console.log("Button has been clicked")

  // await contractCall('buyGame', [], prices)s

  const dataIndex = event.target.id
  const gamePrice = GameArray[dataIndex].price
  console.log(gamePrice)
  const gameid = GameArray[dataIndex].id
  console.log("Price of product", gamePrice)


  
    await contractCall('buyGame', [dataIndex], parseInt(gamePrice, 10))
    

 
    const messageId = document.getElementById(`${gameid}`)
    console.log(messageId)

    messageId.innerHTML = "Purchased";
    location.reload(true)


  
  // sold = purchased_game.purchased 
  // GameArray.push({
  //   purchased : p


  // })

  // const foundIndex = productListArr.findIndex(product => product.id === dataIndex)
  // const value = $(".buyBtn")[foundIndex] ;









  renderProduct();
  $("#loadings").hide();
});