async function signup() {
    var response = fetch("/signup",{
        method: "POST",
        headers : {
            "Content-Type" : "application/json"
        },
        body : Json.stringify({
                "Full_name" : "Ritik", 
                "username" : "not_a_dad",
                "email" : "pointing@gmail.com", 
                "password" : "9234611798@"
        })
    })
    var data = await res
}
