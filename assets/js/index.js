const contractSource = `
payable contract Gamify =

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
  
  payable stateful entrypoint addGame(name':string, price':int, images':string, description' : string ) =
    let game = {id=getGameLength() + 1, name=name', price=price', description = description', images=images',purchased=0, owner=Call.caller}
    let index = getGameLength() + 1
    put(state{games[index] = game, gameLength  = index})

  
  entrypoint getGame(index:int) : game = 
    switch(Map.lookup(index, state.games))
      None => abort("Game does not exist with this index")
      Some(x) => x  
  
  payable stateful entrypoint buyGame(_id:int)=
    let game = getGame(_id)
    
    let  owner  = game.owner : address
    
    require(game.id > 0,abort("NOT A GAME "))
    

    require(Call.value >= game.price,abort("You Don't Have Enough AE"))

    


    let updated_game = {
      id=game.id,
      name=game.name,
      price=game.price,
      images=game.images,
      description = game.description,
      purchased = game.purchased + 1, 
      owner=Call.caller}
    
    put(state{games[_id] = updated_game})
    
    
    Chain.spend(owner, Call.value)
    `;




const contractAddress = 'ct_rsiFtDyMSRZ5bEbiJet9HTs9yxQqN5a7wQMeNQXTM1UuvFaQe';
var GameArray = [];
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
  console.log("Rendered")
}

async function callStatic(func, args) {

  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

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



// test



document.addEventListener('DOMContentLoaded', async () => {

  $("#loadings").show();


  const node = await IpfsHttpClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',

  })
  console.log(node)
  window.node = node

  $("#loadings").hide();

})
var buffer = null

window.addEventListener('load', async () => {
  $("#loadings").show();

  client = await Ae.Aepp()

  gameLength = await callStatic('getGameLength', []);



  for (let i = 1; i <= gameLength; i++) {
    const games = await callStatic('getGame', [i]);

    GameArray.push({
      id: games.id,
      imageUrl: games.images,
      name: games.name,
      price: games.price,
      purchased: games.purchased,
      description: games.description

    })
  }

  renderProduct();
  $("#loadings").hide();
});



const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });

$("#upload").on("change", function () {
  var reader = new FileReader();
  reader.onload = function (e) {

    const magic_array_buffer_converted_to_buffer = buffer.Buffer(reader.result); // honestly as a web developer I do not fully appreciate the difference between buffer and arrayBuffer 
    ipfs.add(magic_array_buffer_converted_to_buffer, (err, result) => {
      console.log(err, result);

      let ipfsLink = "<a href='https://gateway.ipfs.io/ipfs/" + result[0].hash + "'>gateway.ipfs.io/ipfs/" + result[0].hash + "</a>";
      document.getElementById("link").innerHTML = ipfsLink;

    })
  }
  reader.readAsArrayBuffer(this.files[0]);
})

// $('#regButton').click(async function () {
//   $("#loadings").show();

//   var name = ($('#name').val()),

//     game = document.getElementById("game")

//   price = ($('#price').val());

//   description = ($('#description').val());

//   var file = game

//   const reader = new window.FileReader()
//   reader.readAsArrayBuffer(file)
//   reader.onloadend = () => {
//     var buffer = Buffer(reader.result)
//     // var fileAdded = await node.add(buffer)
//     console.log(buffer)

//     var fileAdded = node.add(buffer, (error, result) => {
//       console.log("Result:", result)
//       if (error) {
//         console.error("error", error)
//         return;
//       }
//       result.forEach(async (file) => {
//         console.log("successfully stored", file.hash)


//         prices = parseInt(price, 10)
//         reggame = await contractCall('addGame', [name, prices, file.hash, description], 1000)
//         console.log(reggame)

//         GameArray.push({
//           id: GameArray.length + 1,
//           name: name,
//           url: url,
//           price: prices,
//           hash: file.hash



//         })
//         location.reload((true))
//         renderProduct();
//         $("#loadings").hide();
//       });
//     })






//   };

$("#body").click(".btn", async function (event) {
  $("#loadings").show();
  console.log("Purchasing")


  dataIndex = event.target.id
  game = await callStatic('getGame', [dataIndex])




  await contractCall('buyGame', [dataIndex], parseInt(game.price, 10))

  // document.getElementsByName('successful').innerHtml = "Purchased Successfully" ;




  location.reload(true)




  renderProduct();
  $("#loadings").hide();
});
// })